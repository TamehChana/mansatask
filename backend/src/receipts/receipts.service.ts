import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);
  private readonly receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    // Ensure receipts directory exists (for local storage fallback)
    if (!fs.existsSync(this.receiptsDir)) {
      fs.mkdirSync(this.receiptsDir, { recursive: true });
    }
  }

  /**
   * Generate a unique receipt number
   * Format: RCP-YYYY-XXXXXX
   */
  private generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `RCP-${year}-${randomNum}`;
  }

  /**
   * Generate PDF receipt
   */
  private async generatePDF(
    transaction: any,
    receiptNumber: string,
  ): Promise<Buffer> {
    // Generate QR code first (before creating PDF)
    let qrCodeImage: Buffer | null = null;
    if (transaction.paymentLink) {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(
          `${transaction.externalReference}`,
          { errorCorrectionLevel: 'M', width: 150 },
        );
        qrCodeImage = Buffer.from(
          qrCodeDataUrl.split(',')[1],
          'base64',
        );
      } catch (error) {
        this.logger.warn(`Failed to generate QR code: ${error.message}`);
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('PAYMENT RECEIPT', {
          align: 'center',
        });
        doc.moveDown();

        // Receipt Number
        doc.fontSize(12).font('Helvetica').text(`Receipt Number: ${receiptNumber}`, {
          align: 'center',
        });
        doc.moveDown(0.5);

        // Date of Payment (header)
        const paymentDateHeader = new Date(transaction.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc
          .fontSize(10)
          .text(`Date of Payment: ${paymentDateHeader}`, { align: 'center' });
        doc.moveDown(2);

        // Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Merchant Information
        doc.fontSize(14).font('Helvetica-Bold').text('Merchant Information', {
          underline: true,
        });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Name: ${transaction.user.name}`);
        doc.text(`Email: ${transaction.user.email}`);
        if (transaction.user.phone) {
          doc.text(`Phone: ${transaction.user.phone}`);
        }
        doc.moveDown();

        // Product/Service Information
        if (transaction.paymentLink) {
          doc.fontSize(14).font('Helvetica-Bold').text('Product/Service Information', {
            underline: true,
          });
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica');
          
          // Product title (from payment link title or product name)
          const productTitle = transaction.paymentLink.title || 
            (transaction.paymentLink.product?.name) || 
            'N/A';
          doc.text(`Product Title: ${productTitle}`);
          
          // Description (from payment link description or product description)
          const description = transaction.paymentLink.description || 
            (transaction.paymentLink.product?.description) || 
            null;
          if (description) {
            // Handle multi-line descriptions
            doc.text(`Description:`, { continued: false });
            doc.text(description, { 
              indent: 20,
              width: 480, // Allow text wrapping
            });
          }
          doc.moveDown();
        }

        // Customer Information
        doc.fontSize(14).font('Helvetica-Bold').text('Customer Information', {
          underline: true,
        });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Name: ${transaction.customerName}`);
        if (transaction.customerEmail) {
          doc.text(`Email: ${transaction.customerEmail}`);
        }
        doc.text(`Phone: ${transaction.customerPhone}`);
        doc.moveDown();

        // Payment Details
        doc.fontSize(14).font('Helvetica-Bold').text('Payment Details', {
          underline: true,
        });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        
        // Date of payment
        const paymentDate = new Date(transaction.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc.text(`Date of Payment: ${paymentDate}`);
        
        // Payment reference
        doc.text(`Payment Reference: ${transaction.externalReference}`);
        
        if (transaction.providerTransactionId) {
          doc.text(`Provider Transaction ID: ${transaction.providerTransactionId}`);
        }
        doc.text(`Payment Method: ${transaction.provider}`);
        doc.moveDown();

        // Amount Paid
        doc.fontSize(16).font('Helvetica-Bold');
        const amount = Number(transaction.amount).toLocaleString('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        doc.text(`Amount Paid: ${amount} F CFA`, { align: 'center' });
        doc.moveDown(2);

        // Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // QR Code (if generated successfully)
        if (qrCodeImage) {
          try {
            doc.image(qrCodeImage, {
              fit: [150, 150],
              align: 'center',
            });
            doc.moveDown(0.5);
            doc.fontSize(9).font('Helvetica').text('Scan QR code for transaction verification', {
              align: 'center',
            });
          } catch (error) {
            this.logger.warn(`Failed to add QR code to PDF: ${error.message}`);
          }
        }

        // Footer
        doc.moveDown();
        doc.fontSize(8).font('Helvetica').text('Thank you for your payment!', {
          align: 'center',
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate receipt for a transaction
   */
  async generateReceipt(transactionId: string, userId?: string) {
    // Fetch transaction with relations
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        ...(userId && { userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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

    if (userId && transaction.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'SUCCESS') {
      throw new BadRequestException(
        'Receipt can only be generated for successful transactions',
      );
    }

    // Check if receipt already exists
    const existingReceipt = await this.prisma.receipt.findUnique({
      where: { transactionId },
    });

    if (existingReceipt) {
      return existingReceipt;
    }

    // Generate receipt number
    let receiptNumber = this.generateReceiptNumber();
    let attempts = 0;
    while (
      await this.prisma.receipt.findUnique({ where: { receiptNumber } })
    ) {
      receiptNumber = this.generateReceiptNumber();
      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique receipt number');
      }
    }

    // Generate PDF
    const pdfBuffer = await this.generatePDF(transaction, receiptNumber);

    // Save PDF to S3 or local storage
    const filename = `${receiptNumber}.pdf`;
    const storageKey = `receipts/${filename}`;

    // Upload to S3 or local storage
    const uploadResult = await this.storageService.uploadFile(
      pdfBuffer,
      storageKey,
      'application/pdf',
    );

    // Store the URL and key in database
    const pdfUrl = uploadResult.url;
    const pdfPath = uploadResult.storageType === 's3' ? storageKey : path.join(this.receiptsDir, filename);

    // If using local storage, also save the file locally
    if (uploadResult.storageType === 'local') {
      const localPath = path.join(this.receiptsDir, filename);
      fs.writeFileSync(localPath, pdfBuffer);
    }

    // Create receipt record
    const receipt = await this.prisma.receipt.create({
      data: {
        transactionId,
        receiptNumber,
        pdfUrl,
        pdfPath,
      },
      include: {
        transaction: true,
      },
    });

    this.logger.log(`Receipt generated: ${receiptNumber} for transaction ${transactionId}`);
    return receipt;
  }

  /**
   * Get receipt by transaction ID
   */
  async getReceiptByTransactionId(transactionId: string, userId?: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { transactionId },
      include: {
        transaction: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    if (userId && receipt.transaction.userId !== userId) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }

  /**
   * Get receipt PDF file path or buffer
   */
  async getReceiptPDF(transactionId: string, userId?: string): Promise<string | Buffer> {
    const receipt = await this.getReceiptByTransactionId(transactionId, userId);

    if (!receipt.pdfPath) {
      throw new NotFoundException('Receipt PDF file not found');
    }

    // If it's an S3 key (starts with 'receipts/'), get from S3
    if (receipt.pdfPath.startsWith('receipts/')) {
      try {
        return await this.storageService.getFile(receipt.pdfPath);
      } catch (error) {
        this.logger.error(`Failed to get receipt from S3: ${error.message}`);
        throw new NotFoundException('Receipt PDF file not found');
      }
    }

    // Otherwise, it's a local file path
    if (!fs.existsSync(receipt.pdfPath)) {
      throw new NotFoundException('Receipt PDF file not found');
    }

    return receipt.pdfPath;
  }

  /**
   * Get receipt by external reference (public endpoint)
   */
  async getReceiptByExternalReference(externalReference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { externalReference },
      include: {
        receipt: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'SUCCESS') {
      throw new BadRequestException(
        'Receipt can only be accessed for successful transactions',
      );
    }

    // Generate receipt if it doesn't exist
    if (!transaction.receipt) {
      return await this.generateReceipt(transaction.id);
    }

    return await this.getReceiptByTransactionId(transaction.id);
  }

  /**
   * Get receipt PDF file path or buffer by external reference (public endpoint)
   */
  async getReceiptPDFByExternalReference(
    externalReference: string,
  ): Promise<string | Buffer> {
    const receipt = await this.getReceiptByExternalReference(externalReference);

    if (!receipt.pdfPath) {
      throw new NotFoundException('Receipt PDF file not found');
    }

    // If it's an S3 key (starts with 'receipts/'), get from S3
    if (receipt.pdfPath.startsWith('receipts/')) {
      try {
        return await this.storageService.getFile(receipt.pdfPath);
      } catch (error) {
        this.logger.error(`Failed to get receipt from S3: ${error.message}`);
        throw new NotFoundException('Receipt PDF file not found');
      }
    }

    // Otherwise, it's a local file path
    if (!fs.existsSync(receipt.pdfPath)) {
      throw new NotFoundException('Receipt PDF file not found');
    }

    return receipt.pdfPath;
  }
}
