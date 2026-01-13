import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentLinksService } from '../payment-links/payment-links.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import { MansaTransfersService } from './services/mansa-transfers.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentProvider, TransactionStatus, Prisma } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { ReceiptsService } from '../receipts/receipts.service';
import * as fs from 'fs';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentLinksService: PaymentLinksService,
    private readonly idempotencyService: IdempotencyService,
    private readonly mansaTransfersService: MansaTransfersService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => ReceiptsService))
    private readonly receiptsService: ReceiptsService,
  ) {}

  /**
   * Generate unique external reference for transaction
   * Format: TXN-{timestamp}-{randomString}
   */
  private generateExternalReference(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `TXN-${timestamp}-${randomString}`;
  }

  /**
   * Normalize phone number to standard format (Cameroon format: +237)
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove spaces and dashes
    let normalized = phone.replace(/[\s-]/g, '');

    // Convert 0 prefix to +237 (Cameroon format)
    if (normalized.startsWith('0')) {
      normalized = '+237' + normalized.substring(1);
    }

    // Ensure +237 prefix (Cameroon format)
    if (!normalized.startsWith('+237')) {
      normalized = '+237' + normalized;
    }

    return normalized;
  }

  /**
   * Initiate payment
   * 
   * Process:
   * 1. Check idempotency key (Redis)
   * 2. Validate payment link
   * 3. Create transaction record (status: PENDING)
   * 4. Generate unique external reference
   * 5. Call Mansa Transfers API to initiate payment
   * 6. Store provider transaction ID
   * 7. Store idempotency key response
   * 8. Return transaction reference to client
   */
  async initiatePayment(
    initiatePaymentDto: InitiatePaymentDto,
    idempotencyKey: string,
  ) {
    this.logger.log(`Initiating payment with idempotency key: ${idempotencyKey}`, {
      idempotencyKey,
      paymentLinkId: initiatePaymentDto.paymentLinkId,
      slug: initiatePaymentDto.slug,
      paymentProvider: initiatePaymentDto.paymentProvider,
    });

    // Validate: Must provide either paymentLinkId OR slug (not both, not neither)
    if (!initiatePaymentDto.paymentLinkId && !initiatePaymentDto.slug) {
      throw new BadRequestException(
        'Either paymentLinkId or slug must be provided',
      );
    }

    if (initiatePaymentDto.paymentLinkId && initiatePaymentDto.slug) {
      throw new BadRequestException(
        'Cannot provide both paymentLinkId and slug',
      );
    }

    // Check idempotency key
    const storedResponse = await this.idempotencyService.getStoredResponse(
      idempotencyKey,
    );
    if (storedResponse) {
      this.logger.log(
        `Duplicate request detected (idempotency key: ${idempotencyKey}), returning stored response`,
        {
          idempotencyKey,
          event: 'duplicate_payment_request',
        },
      );
      return storedResponse;
    }

    // Find payment link
    let paymentLink;
    if (initiatePaymentDto.paymentLinkId) {
      // For protected endpoints, we'd validate ownership
      // For public endpoint, we just need to find the link
      paymentLink = await this.prisma.paymentLink.findFirst({
        where: {
          id: initiatePaymentDto.paymentLinkId,
          deletedAt: null,
        },
        include: {
          product: true,
        },
      });
    } else {
      // Use slug (public access)
      paymentLink = await this.paymentLinksService.findBySlug(
        initiatePaymentDto.slug!,
      );
    }

    if (!paymentLink) {
      throw new NotFoundException('Payment link not found');
    }

    // Validate payment link is valid for use
    if (!paymentLink.isActive) {
      throw new BadRequestException('Payment link is not active');
    }

    if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
      throw new BadRequestException('Payment link has expired');
    }

    if (
      paymentLink.maxUses &&
      paymentLink.currentUses >= paymentLink.maxUses
    ) {
      throw new BadRequestException(
        'Payment link has reached maximum number of uses',
      );
    }

    // Check if product is in stock (if payment link is linked to a product)
    if (paymentLink.productId && paymentLink.product) {
      if (
        paymentLink.product.quantity !== null &&
        paymentLink.product.quantity <= 0
      ) {
        throw new BadRequestException(
          `Product "${paymentLink.product.name}" is out of stock`,
        );
      }
    }

    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(
      initiatePaymentDto.customerPhone,
    );

    // Generate external reference
    const externalReference = this.generateExternalReference();

    this.logger.log(`Creating transaction record: ${externalReference}`, {
      externalReference,
      paymentLinkId: paymentLink.id,
      amount: Number(paymentLink.amount),
      paymentProvider: initiatePaymentDto.paymentProvider,
      event: 'transaction_created',
    });

    // Create transaction record (status: PENDING)
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: paymentLink.userId,
        paymentLinkId: paymentLink.id,
        externalReference,
        status: TransactionStatus.PENDING,
        provider: initiatePaymentDto.paymentProvider,
        customerName: initiatePaymentDto.customerName,
        customerPhone: normalizedPhone,
        customerEmail: initiatePaymentDto.customerEmail || null,
        amount: paymentLink.amount,
      },
      include: {
        paymentLink: true,
      },
    });

    // Call Mansa Transfers API to initiate payment
    let providerTransactionId: string | null = null;
    try {
      const providerResponse = await this.mansaTransfersService.initiatePayment(
        Number(paymentLink.amount),
        normalizedPhone,
        initiatePaymentDto.customerName,
        initiatePaymentDto.paymentProvider,
        externalReference,
        initiatePaymentDto.customerEmail,
      );

      providerTransactionId = providerResponse.providerTransactionId;

      // Update transaction with provider transaction ID
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          providerTransactionId,
          providerResponse: providerResponse as any,
          status: TransactionStatus.PROCESSING,
        },
      });
    } catch (error) {
      this.logger.error(
        `Payment provider API call failed: ${error.message}`,
        error.stack,
        {
          externalReference,
          transactionId: transaction.id,
          paymentProvider: initiatePaymentDto.paymentProvider,
          event: 'payment_provider_error',
          error: error.message,
        },
      );

      // Update transaction status to FAILED (if transaction exists)
      try {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            failureReason: `Provider API error: ${error.message}`,
            providerResponse: { error: error.message } as any,
          },
        });
      } catch (updateError) {
        this.logger.error(
          `Failed to update transaction status: ${updateError.message}`,
        );
        // Continue even if update fails
      }

      throw new BadRequestException('Failed to initiate payment with provider');
    }

    // Increment payment link usage count
    await this.prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        currentUses: {
          increment: 1,
        },
      },
    });

    // Prepare response
    const response = {
      externalReference,
      status: TransactionStatus.PROCESSING,
      providerTransactionId,
      amount: Number(paymentLink.amount),
      paymentProvider: initiatePaymentDto.paymentProvider,
    };

    // Store response in Redis for idempotency (TTL: 24 hours)
    await this.idempotencyService.storeResponse(idempotencyKey, response, 24 * 60 * 60);

    this.logger.log(
      `Payment initiated successfully: ${externalReference}`,
      {
        externalReference,
        transactionId: transaction.id,
        providerTransactionId,
        paymentLinkId: paymentLink.id,
        amount: Number(paymentLink.amount),
        paymentProvider: initiatePaymentDto.paymentProvider,
        customerPhone: normalizedPhone,
        event: 'payment_initiated',
      },
    );

    return response;
  }

  /**
   * Get payment status by external reference (public endpoint)
   * Also checks with payment provider API for latest status
   */
  async getPaymentStatusByExternalReference(externalReference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { externalReference },
      include: {
        paymentLink: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // If transaction is still PENDING or PROCESSING, check with provider API
    if (
      transaction.providerTransactionId &&
      (transaction.status === TransactionStatus.PENDING ||
        transaction.status === TransactionStatus.PROCESSING)
    ) {
      try {
        this.logger.log(
          `Checking payment status with provider for: ${transaction.providerTransactionId}`,
        );

        const providerStatus = await this.mansaTransfersService.checkPaymentStatus(
          transaction.providerTransactionId,
        );

        // Convert string status to TransactionStatus enum
        const newStatus = providerStatus.status as TransactionStatus;

        // Update transaction status if it changed
        if (newStatus !== transaction.status) {
          this.logger.log(
            `Status updated from ${transaction.status} to ${newStatus}`,
          );

          const updatedTransaction = await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: newStatus,
              updatedAt: new Date(),
            },
            include: {
              paymentLink: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          // Update transaction object for response
          transaction.status = newStatus;

          // Handle payment success: Generate receipt and send email
          if (newStatus === TransactionStatus.SUCCESS) {
            this.handlePaymentSuccess(updatedTransaction).catch((error) => {
              this.logger.error(
                `Error handling payment success: ${error.message}`,
                error.stack,
              );
            });
          }

          // Handle payment failure: Send failure email
          if (newStatus === TransactionStatus.FAILED && updatedTransaction.customerEmail) {
            this.handlePaymentFailure(updatedTransaction).catch((error) => {
              this.logger.error(
                `Error handling payment failure: ${error.message}`,
                error.stack,
              );
            });
          }
        } else {
          this.logger.debug(
            `Status unchanged: ${transaction.status} (no update needed)`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Failed to check status with provider: ${error.message}. Using cached status.`,
        );
        // Continue with database status if API check fails
      }
    }

    return {
      id: transaction.id,
      externalReference: transaction.externalReference,
      status: transaction.status,
      provider: transaction.provider,
      amount: Number(transaction.amount),
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      customerEmail: transaction.customerEmail,
      providerTransactionId: transaction.providerTransactionId,
      failureReason: transaction.failureReason,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paymentLink: {
        id: transaction.paymentLink.id,
        title: transaction.paymentLink.title,
        slug: transaction.paymentLink.slug,
      },
    };
  }

  /**
   * Get payment by ID (protected endpoint)
   */
  async getPaymentById(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
      },
      include: {
        paymentLink: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Authorization check: User must own the transaction
    if (transaction.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this transaction',
      );
    }

    return transaction;
  }

  /**
   * Handle payment success: Decrement product quantity, generate receipt and send email
   */
  private async handlePaymentSuccess(transaction: any): Promise<void> {
    try {
      // Decrement product quantity if payment link is linked to a product
      if (transaction.paymentLink?.productId) {
        try {
          const product = await this.prisma.product.findUnique({
            where: { id: transaction.paymentLink.productId },
          });

          if (product) {
            // Only decrement if quantity is tracked (not unlimited/999999)
            // Quantity >= 999999 means unlimited stock
            if (product.quantity !== null && product.quantity !== undefined && product.quantity < 999999 && product.quantity > 0) {
              const oldQuantity = product.quantity;
              await this.prisma.product.update({
                where: { id: product.id },
                data: {
                  quantity: {
                    decrement: 1,
                  },
                },
              });
              this.logger.log(
                `Product quantity decremented: ${product.id} (${oldQuantity} -> ${oldQuantity - 1})`,
              );
            } else if (product.quantity === 0) {
              this.logger.warn(
                `Product ${product.id} is out of stock but payment was successful - quantity already at 0`,
              );
            } else if (product.quantity >= 999999) {
              this.logger.log(
                `Product ${product.id} has unlimited stock (quantity: ${product.quantity}) - skipping decrement`,
              );
            }
          }
        } catch (productError) {
          this.logger.error(
            `Failed to decrement product quantity: ${productError.message}`,
            productError.stack,
          );
          // Continue even if quantity update fails
        }
      }

      // Auto-generate receipt
      let receiptBuffer: Buffer | undefined;
      let receiptPath: string | undefined;
      try {
        const receipt = await this.receiptsService.generateReceipt(transaction.id);
        receiptPath = receipt.pdfPath || undefined;
        
        // Get receipt as buffer for email attachment (handles both S3 and local storage)
        if (receiptPath) {
          try {
            const receiptPdf = await this.receiptsService.getReceiptPDF(transaction.id);
            // getReceiptPDF returns Buffer for S3 or string path for local
            if (receiptPdf instanceof Buffer) {
              receiptBuffer = receiptPdf;
            } else if (typeof receiptPdf === 'string' && fs.existsSync(receiptPdf)) {
              // For local storage, read the file as buffer
              receiptBuffer = fs.readFileSync(receiptPdf);
            }
          } catch (bufferError) {
            this.logger.warn(
              `Failed to get receipt buffer for email: ${bufferError.message}`,
            );
            // Continue without attachment if buffer fetch fails
          }
        }
        
        this.logger.log(`Receipt generated for transaction: ${transaction.id}`);
      } catch (receiptError) {
        this.logger.error(
          `Failed to generate receipt: ${receiptError.message}`,
          receiptError.stack,
        );
        // Continue even if receipt generation fails
      }

      // Send payment success email with receipt attachment
      if (!transaction.customerEmail) {
        this.logger.warn(
          `Transaction ${transaction.id} has no customer email - skipping email notification`,
        );
        return;
      }

      try {
        await this.emailService.sendPaymentSuccessEmail({
          customerName: transaction.customerName,
          customerEmail: transaction.customerEmail,
          merchantName: transaction.user.name,
          amount: Number(transaction.amount),
          transactionReference: transaction.externalReference,
          paymentDate: new Date(transaction.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          paymentMethod: transaction.provider,
          receiptBuffer, // Prefer buffer over path
          receiptPath, // Fallback for local storage
        });
        this.logger.log(
          `Payment success email sent to: ${transaction.customerEmail}`,
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send payment success email: ${emailError.message}`,
          emailError.stack,
        );
        // Don't throw - email failure shouldn't break payment processing
      }
    } catch (error) {
      this.logger.error(
        `Error processing payment success actions: ${error.message}`,
        error.stack,
      );
      // Don't throw - continue even if email/receipt generation fails
    }
  }

  /**
   * Handle payment failure: Send failure email
   */
  private async handlePaymentFailure(transaction: any): Promise<void> {
    try {
      if (!transaction.customerEmail) {
        return;
      }

      await this.emailService.sendPaymentFailedEmail({
        customerName: transaction.customerName,
        customerEmail: transaction.customerEmail,
        merchantName: transaction.user.name,
        amount: Number(transaction.amount),
        transactionReference: transaction.externalReference,
        paymentDate: new Date(transaction.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        failureReason: transaction.failureReason || undefined,
      });
      this.logger.log(
        `Payment failed email sent to: ${transaction.customerEmail}`,
      );
    } catch (emailError) {
      this.logger.error(
        `Failed to send payment failed email: ${emailError.message}`,
        emailError.stack,
      );
      // Don't throw - email failure shouldn't break payment processing
    }
  }

  /**
   * Check Mansa Transfers API health/connectivity
   * This endpoint verifies that the API integration is actually working
   */
  async checkApiHealth() {
    try {
      this.logger.log('Checking Mansa Transfers API health...');
      
      // Try to authenticate with the API
      // This will make an actual HTTP request to the API
      const startTime = Date.now();
      
      try {
        // Attempt to authenticate (this makes a real API call)
        const authResult = await this.mansaTransfersService.testAuthentication();
        const duration = Date.now() - startTime;

        return {
          success: authResult.success,
          status: authResult.success ? 'connected' : 'error',
          message: authResult.message,
          apiBaseUrl: process.env.MANSA_API_BASE_URL || 'https://api-stage.mansatransfers.com',
          responseTime: `${duration}ms`,
          timestamp: new Date().toISOString(),
          verification: {
            note: 'This endpoint makes an actual HTTP request to the Mansa Transfers API',
            authentication: authResult.success ? 'success' : 'failed',
            apiEndpoint: '/api/v1/xyz/authenticate',
            proof: 'Check the API logs endpoint to see actual request/response data',
          },
        };
      } catch (authError: any) {
        const duration = Date.now() - startTime;
        
        return {
          success: false,
          status: 'error',
          message: 'Failed to connect to Mansa Transfers API',
          error: authError.message,
          apiBaseUrl: process.env.MANSA_API_BASE_URL || 'https://api-stage.mansatransfers.com',
          responseTime: `${duration}ms`,
          timestamp: new Date().toISOString(),
          verification: {
            note: 'This endpoint makes an actual HTTP request to the Mansa Transfers API',
            authentication: 'failed',
            apiEndpoint: '/api/v1/xyz/authenticate',
          },
        };
      }
    } catch (error: any) {
      this.logger.error(`API health check failed: ${error.message}`);
      
      return {
        success: false,
        status: 'error',
        message: 'API health check failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get recent API call logs
   * This shows actual API requests/responses to prove the integration is real
   */
  async getApiLogs() {
    try {
      // Get logs from the API log service
      const logs = this.mansaTransfersService.getApiLogs();
      
      return {
        success: true,
        message: 'API call logs retrieved successfully',
        totalLogs: logs.length,
        logs: logs,
        note: 'These are actual HTTP requests made to the Mansa Transfers API. Sensitive data (API keys, secrets) has been redacted for security.',
        apiBaseUrl: process.env.MANSA_API_BASE_URL || 'https://api-stage.mansatransfers.com',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get API logs: ${error.message}`);
      
      return {
        success: false,
        message: 'Failed to retrieve API logs',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

