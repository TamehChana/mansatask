import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { TransactionStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { ReceiptsService } from '../receipts/receipts.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string;
  private readonly WEBHOOK_PREFIX = 'webhook:';
  private readonly WEBHOOK_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ReceiptsService))
    private readonly receiptsService: ReceiptsService,
    private readonly emailService: EmailService,
  ) {
    this.webhookSecret =
      this.configService.get<string>('config.webhook.secret') || '';
  }

  /**
   * Generate Redis key for webhook idempotency
   */
  private getWebhookKey(transactionId: string): string {
    return `${this.WEBHOOK_PREFIX}${transactionId}`;
  }

  /**
   * Verify webhook signature
   * 
   * This is a placeholder implementation. The actual signature verification
   * should be implemented based on Mansa Transfers API documentation.
   * 
   * Common patterns:
   * - HMAC-SHA256 with webhook secret
   * - Signature in X-Signature header
   * - Payload hash verification
   */
  async verifySignature(
    payload: string | Buffer,
    signature: string,
  ): Promise<boolean> {
    if (!this.webhookSecret) {
      this.logger.warn(
        'Webhook secret not configured - skipping signature verification',
      );
      // In development, allow webhooks without signature
      // In production, this should throw an error
      return process.env.NODE_ENV === 'development';
    }

    if (!signature) {
      this.logger.warn('Webhook signature missing');
      return false;
    }

    try {
      // Common webhook signature verification pattern:
      // HMAC-SHA256(payload, secret) === signature
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      // Compare signatures in constant time to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex'),
      );

      if (!isValid) {
        this.logger.warn('Webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Webhook signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if webhook was already processed (duplicate prevention)
   */
  async isDuplicate(transactionId: string): Promise<boolean> {
    const key = this.getWebhookKey(transactionId);
    const exists = await this.redisService.exists(key);
    return exists;
  }

  /**
   * Mark webhook as processed
   */
  async markAsProcessed(transactionId: string): Promise<void> {
    const key = this.getWebhookKey(transactionId);
    await this.redisService.set(key, 'processed', this.WEBHOOK_TTL);
  }

  /**
   * Process payment webhook
   * 
   * Process:
   * 1. Verify webhook signature
   * 2. Check for duplicate webhooks
   * 3. Find transaction by provider transaction ID
   * 4. Update transaction status
   * 5. Mark webhook as processed
   * 6. Return success
   */
  async processPaymentWebhook(webhookDto: PaymentWebhookDto) {
    this.logger.log(
      `Processing payment webhook: ${webhookDto.transactionId} - Status: ${webhookDto.status}`,
      {
        transactionId: webhookDto.transactionId,
        status: webhookDto.status,
        event: 'webhook_received',
      },
    );

    // Check for duplicate webhook
    const isDuplicate = await this.isDuplicate(webhookDto.transactionId);
    if (isDuplicate) {
      this.logger.log(
        `Duplicate webhook detected: ${webhookDto.transactionId} - ignoring`,
        {
          transactionId: webhookDto.transactionId,
          event: 'webhook_duplicate',
        },
      );
      return {
        success: true,
        message: 'Webhook already processed',
        duplicate: true,
      };
    }

    // Find transaction by provider transaction ID
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        providerTransactionId: webhookDto.transactionId,
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

    if (!transaction) {
      this.logger.warn(
        `Transaction not found for provider transaction ID: ${webhookDto.transactionId}`,
      );
      // Don't throw error - webhook might be for transaction we don't have
      // Log it and return success to prevent webhook retries
      return {
        success: true,
        message: 'Transaction not found (logged)',
      };
    }

    // Update transaction status
    const updateData: Prisma.TransactionUpdateInput = {
      status: webhookDto.status,
      providerResponse: webhookDto as any,
      updatedAt: new Date(),
    };

    if (webhookDto.failureReason) {
      updateData.failureReason = webhookDto.failureReason;
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: updateData,
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

    // Mark webhook as processed
    await this.markAsProcessed(webhookDto.transactionId);

    this.logger.log(
      `Transaction status updated: ${transaction.id} -> ${webhookDto.status}`,
    );

    // Handle payment success: Generate receipt, send email, and decrement product quantity
    if (webhookDto.status === TransactionStatus.SUCCESS) {
      try {
        // Decrement product quantity if payment link is linked to a product
        if (updatedTransaction.paymentLink?.productId) {
          try {
            const product = await this.prisma.product.findUnique({
              where: { id: updatedTransaction.paymentLink.productId },
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
          const receipt = await this.receiptsService.generateReceipt(
            updatedTransaction.id,
          );
          receiptPath = receipt.pdfPath || undefined;
          
          // Get receipt as buffer for email attachment (handles both S3 and local storage)
          if (receiptPath) {
            try {
              const receiptPdf = await this.receiptsService.getReceiptPDF(updatedTransaction.id);
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
          
          this.logger.log(
            `Receipt generated for transaction: ${updatedTransaction.id}`,
          );
        } catch (receiptError) {
          this.logger.error(
            `Failed to generate receipt: ${receiptError.message}`,
            receiptError.stack,
          );
          // Continue even if receipt generation fails
        }

        // Send payment success email with receipt attachment
        if (!updatedTransaction.customerEmail) {
          this.logger.warn(
            `Transaction ${updatedTransaction.id} has no customer email - skipping email notification`,
          );
        }
        
        if (updatedTransaction.customerEmail) {
          try {
            await this.emailService.sendPaymentSuccessEmail({
              customerName: updatedTransaction.customerName,
              customerEmail: updatedTransaction.customerEmail,
              merchantName: updatedTransaction.user.name,
              amount: Number(updatedTransaction.amount),
              transactionReference: updatedTransaction.externalReference,
              paymentDate: new Date(updatedTransaction.createdAt).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              ),
              paymentMethod: updatedTransaction.provider,
              receiptBuffer, // Prefer buffer over path
              receiptPath, // Fallback for local storage
            });
            this.logger.log(
              `Payment success email sent to: ${updatedTransaction.customerEmail}`,
            );
          } catch (emailError) {
            this.logger.error(
              `Failed to send payment success email: ${emailError.message}`,
              emailError.stack,
            );
            // Don't throw - email failure shouldn't break webhook processing
          }
        }
      } catch (error) {
        this.logger.error(
          `Error processing payment success actions: ${error.message}`,
          error.stack,
        );
        // Continue even if email/receipt generation fails
      }
    }

    // Handle payment failure: Send failure email
    if (
      webhookDto.status === TransactionStatus.FAILED &&
      updatedTransaction.customerEmail
    ) {
      try {
        await this.emailService.sendPaymentFailedEmail({
          customerName: updatedTransaction.customerName,
          customerEmail: updatedTransaction.customerEmail,
          merchantName: updatedTransaction.user.name,
          amount: Number(updatedTransaction.amount),
          transactionReference: updatedTransaction.externalReference,
          paymentDate: new Date(updatedTransaction.createdAt).toLocaleDateString(
            'en-US',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            },
          ),
          failureReason: webhookDto.failureReason || undefined,
        });
        this.logger.log(
          `Payment failed email sent to: ${updatedTransaction.customerEmail}`,
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send payment failed email: ${emailError.message}`,
          emailError.stack,
        );
        // Don't throw - email failure shouldn't break webhook processing
      }
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
      transactionId: updatedTransaction.id,
      status: updatedTransaction.status,
    };
  }
}


