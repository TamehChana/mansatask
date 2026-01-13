import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, PaymentProvider, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

// Explicit mocks for filesystem, PDF, and QR code to avoid mutating read-only module namespace objects
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
jest.mock('pdfkit');
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    receipt: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Configure fs mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

    it('should create receipts directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      new ReceiptsService(mockPrismaService);

      expect(fs.mkdirSync).toHaveBeenCalled();
    });

  describe('generateReceipt', () => {
    const transactionId = 'txn-123';
    const userId = 'user-123';
    const mockTransaction = {
      id: transactionId,
      userId,
      externalReference: 'TXN-123',
      status: TransactionStatus.SUCCESS,
      provider: PaymentProvider.MTN,
      amount: new Prisma.Decimal(5000),
      customerName: 'Test Customer',
      customerPhone: '+237612345678',
      customerEmail: 'customer@example.com',
      providerTransactionId: 'PROV-TXN-123',
      createdAt: new Date(),
      user: {
        id: userId,
        name: 'Test User',
        email: 'user@example.com',
      },
      paymentLink: {
        id: 'link-123',
        title: 'Test Payment Link',
        description: 'Test Description',
        product: null,
      },
    };

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.generateReceipt(transactionId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own transaction', async () => {
      const otherUserTransaction = {
        ...mockTransaction,
        userId: 'other-user',
      };
      mockPrismaService.transaction.findFirst.mockResolvedValue(otherUserTransaction);

      await expect(
        service.generateReceipt(transactionId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when transaction is not successful', async () => {
      const pendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING,
      };
      mockPrismaService.transaction.findFirst.mockResolvedValue(pendingTransaction);

      await expect(
        service.generateReceipt(transactionId, userId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.generateReceipt(transactionId, userId),
      ).rejects.toThrow(
        'Receipt can only be generated for successful transactions',
      );
    });

    it('should return existing receipt if already generated', async () => {
      const existingReceipt = {
        id: 'receipt-123',
        transactionId,
        receiptNumber: 'RCP-2024-123456',
        pdfUrl: '/receipts/RCP-2024-123456.pdf',
        pdfPath: '/path/to/receipt.pdf',
      };

      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.receipt.findUnique.mockResolvedValue(existingReceipt);

      const result = await service.generateReceipt(transactionId, userId);

      expect(result).toEqual(existingReceipt);
      expect(mockPrismaService.receipt.create).not.toHaveBeenCalled();
    });

    it('should generate new receipt when it does not exist', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        transactionId,
        receiptNumber: 'RCP-2024-123456',
        pdfUrl: '/receipts/RCP-2024-123456.pdf',
        pdfPath: path.join(process.cwd(), 'uploads', 'receipts', 'RCP-2024-123456.pdf'),
        transaction: mockTransaction,
      };

      // Mock PDF generation
      const mockPDFDoc = {
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        image: jest.fn().mockReturnThis(),
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('mock-pdf-data'));
          }
          if (event === 'end') {
            callback();
          }
          return mockPDFDoc;
        }),
        y: 100,
      };

      (PDFDocument as any).mockImplementation(() => mockPDFDoc);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,mock-qr',
      );

      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.receipt.findUnique
        .mockResolvedValueOnce(null) // First check - no existing receipt
        .mockResolvedValueOnce(null); // Receipt number uniqueness check
      mockPrismaService.receipt.create.mockResolvedValue(mockReceipt);

      const result = await service.generateReceipt(transactionId, userId);

      expect(result).toEqual(mockReceipt);
      expect(mockPrismaService.receipt.create).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should generate unique receipt number', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        transactionId,
        receiptNumber: 'RCP-2024-789012',
        pdfUrl: '/receipts/RCP-2024-789012.pdf',
        pdfPath: path.join(process.cwd(), 'uploads', 'receipts', 'RCP-2024-789012.pdf'),
        transaction: mockTransaction,
      };

      const mockPDFDoc = {
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        image: jest.fn().mockReturnThis(),
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('mock-pdf-data'));
          }
          if (event === 'end') {
            callback();
          }
          return mockPDFDoc;
        }),
        y: 100,
      };

      (PDFDocument as any).mockImplementation(() => mockPDFDoc);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,mock-qr',
      );

      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.receipt.findUnique
        .mockResolvedValueOnce(null) // No existing receipt
        .mockResolvedValueOnce({ id: 'existing' }) // First receipt number exists
        .mockResolvedValueOnce(null); // Second receipt number is unique
      mockPrismaService.receipt.create.mockResolvedValue(mockReceipt);

      await service.generateReceipt(transactionId, userId);

      expect(mockPrismaService.receipt.findUnique).toHaveBeenCalledTimes(3);
    });
  });

  describe('getReceiptByTransactionId', () => {
    const transactionId = 'txn-123';
    const userId = 'user-123';

    it('should return receipt when found', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        transactionId,
        receiptNumber: 'RCP-2024-123456',
        pdfUrl: '/receipts/RCP-2024-123456.pdf',
        pdfPath: '/path/to/receipt.pdf',
        transaction: {
          id: transactionId,
          userId,
          status: TransactionStatus.SUCCESS,
          user: {
            id: userId,
            name: 'Test User',
            email: 'user@example.com',
          },
        },
      };

      mockPrismaService.receipt.findUnique.mockResolvedValue(mockReceipt);

      const result = await service.getReceiptByTransactionId(transactionId, userId);

      expect(result).toEqual(mockReceipt);
    });

    it('should throw NotFoundException when receipt not found', async () => {
      mockPrismaService.receipt.findUnique.mockResolvedValue(null);

      await expect(
        service.getReceiptByTransactionId(transactionId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own transaction', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        transactionId,
        transaction: {
          id: transactionId,
          userId: 'other-user',
        },
      };

      mockPrismaService.receipt.findUnique.mockResolvedValue(mockReceipt);

      await expect(
        service.getReceiptByTransactionId(transactionId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReceiptPDF', () => {
    const transactionId = 'txn-123';
    const userId = 'user-123';

    it('should return PDF file path when receipt exists', async () => {
      const pdfPath = '/path/to/receipt.pdf';
      const mockReceipt = {
        id: 'receipt-123',
        transactionId,
        pdfPath,
        transaction: {
          id: transactionId,
          userId,
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockPrismaService.receipt.findUnique.mockResolvedValue(mockReceipt);

      const result = await service.getReceiptPDF(transactionId, userId);

      expect(result).toBe(pdfPath);
    });

    it('should throw NotFoundException when PDF file does not exist', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        transactionId,
        pdfPath: '/path/to/receipt.pdf',
        transaction: {
          id: transactionId,
          userId,
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockPrismaService.receipt.findUnique.mockResolvedValue(mockReceipt);

      await expect(
        service.getReceiptPDF(transactionId, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getReceiptPDF(transactionId, userId),
      ).rejects.toThrow('Receipt PDF file not found');
    });
  });

  describe('getReceiptByExternalReference', () => {
    const externalReference = 'TXN-123';

    it('should return receipt for successful transaction', async () => {
      const mockTransaction = {
        id: 'txn-123',
        externalReference,
        status: TransactionStatus.SUCCESS,
        receipt: {
          id: 'receipt-123',
          receiptNumber: 'RCP-2024-123456',
        },
      };

      const mockReceipt = {
        id: 'receipt-123',
        transactionId: 'txn-123',
        receiptNumber: 'RCP-2024-123456',
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.receipt.findUnique.mockResolvedValue(mockReceipt);

      const result = await service.getReceiptByExternalReference(externalReference);

      expect(result).toEqual(mockReceipt);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(
        service.getReceiptByExternalReference(externalReference),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when transaction is not successful', async () => {
      const mockTransaction = {
        id: 'txn-123',
        externalReference,
        status: TransactionStatus.PENDING,
        receipt: null,
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

      await expect(
        service.getReceiptByExternalReference(externalReference),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getReceiptByExternalReference(externalReference),
      ).rejects.toThrow(
        'Receipt can only be accessed for successful transactions',
      );
    });

    it('should generate receipt if it does not exist', async () => {
      const mockTransaction = {
        id: 'txn-123',
        externalReference,
        status: TransactionStatus.SUCCESS,
        receipt: null,
        userId: 'user-123',
        provider: PaymentProvider.MTN,
        amount: new Prisma.Decimal(5000),
        customerName: 'Test Customer',
        customerPhone: '+237612345678',
        customerEmail: 'customer@example.com',
        createdAt: new Date(),
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'user@example.com',
        },
        paymentLink: {
          id: 'link-123',
          title: 'Test Link',
          product: null,
        },
      };

      const mockReceipt = {
        id: 'receipt-123',
        transactionId: 'txn-123',
        receiptNumber: 'RCP-2024-123456',
      };

      const mockPDFDoc = {
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        image: jest.fn().mockReturnThis(),
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('mock-pdf-data'));
          }
          if (event === 'end') {
            callback();
          }
          return mockPDFDoc;
        }),
        y: 100,
      };

      (PDFDocument as any).mockImplementation(() => mockPDFDoc);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,mock-qr',
      );

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.receipt.findUnique
        .mockResolvedValueOnce(null) // No existing receipt
        .mockResolvedValueOnce(null); // Receipt number uniqueness
      mockPrismaService.receipt.create.mockResolvedValue(mockReceipt);

      const result = await service.getReceiptByExternalReference(externalReference);

      expect(result).toEqual(mockReceipt);
      expect(mockPrismaService.receipt.create).toHaveBeenCalled();
    });
  });
});

