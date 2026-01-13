import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentLinksService } from '../payment-links/payment-links.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import { MansaTransfersService } from './services/mansa-transfers.service';
import { EmailService } from '../email/email.service';
import { ReceiptsService } from '../receipts/receipts.service';
import {
  createMockMansaTransfersService,
  createMockEmailService,
  createMockReceiptsService,
  createMockIdempotencyService,
} from '../common/test/mocks';
import { TransactionStatus, PaymentProvider } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let paymentLinksService: PaymentLinksService;
  let idempotencyService: IdempotencyService;
  let mansaTransfersService: MansaTransfersService;

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    paymentLink: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPaymentLinksService = {
    findBySlug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentLinksService,
          useValue: mockPaymentLinksService,
        },
        {
          provide: IdempotencyService,
          useValue: createMockIdempotencyService(),
        },
        {
          provide: MansaTransfersService,
          useValue: createMockMansaTransfersService(),
        },
        {
          provide: EmailService,
          useValue: createMockEmailService(),
        },
        {
          provide: ReceiptsService,
          useValue: createMockReceiptsService(),
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    paymentLinksService = module.get<PaymentLinksService>(PaymentLinksService);
    idempotencyService = module.get<IdempotencyService>(IdempotencyService);
    mansaTransfersService = module.get<MansaTransfersService>(
      MansaTransfersService,
    );

    // Clear mocks but keep the mock functions
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    const mockPaymentLink = {
      id: 'link-123',
      userId: 'user-123',
      amount: 5000,
      isActive: true,
      expiresAt: null,
      maxUses: null,
      currentUses: 0,
      deletedAt: null,
      product: null,
    };

    const initiatePaymentDto = {
      paymentLinkId: 'link-123',
      customerName: 'Test Customer',
      customerPhone: '612345678',
      customerEmail: 'customer@example.com',
      paymentProvider: PaymentProvider.MTN,
    };

    it('should successfully initiate payment', async () => {
      const idempotencyKey = 'idempotency-key-123';
      const mockTransaction = {
        id: 'txn-123',
        externalReference: 'TXN-1234567890-ABC',
        status: TransactionStatus.PENDING,
        ...initiatePaymentDto,
        amount: 5000,
        paymentLink: mockPaymentLink,
      };

      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        null,
      );
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(
        mockPaymentLink,
      );
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
      (mansaTransfersService.initiatePayment as jest.Mock).mockResolvedValue({
        providerTransactionId: 'PROV-TXN-123',
        status: 'PENDING',
      });
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        providerTransactionId: 'PROV-TXN-123',
        status: TransactionStatus.PROCESSING,
      });
      mockPrismaService.paymentLink.update.mockResolvedValue({
        ...mockPaymentLink,
        currentUses: 1,
      });
      (idempotencyService.storeResponse as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.initiatePayment(
        initiatePaymentDto,
        idempotencyKey,
      );

      expect(result).toHaveProperty('externalReference');
      expect(result.externalReference).toMatch(/^TXN-/); // External reference is generated dynamically
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
      expect(mansaTransfersService.initiatePayment).toHaveBeenCalled();
    });

    it('should return stored response if idempotency key exists', async () => {
      const idempotencyKey = 'existing-key';
      const storedResponse = {
        externalReference: 'TXN-EXISTING',
        status: 'PENDING',
      };

      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        storedResponse,
      );

      const result = await service.initiatePayment(
        initiatePaymentDto,
        idempotencyKey,
      );

      expect(result).toEqual(storedResponse);
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
      expect(mansaTransfersService.initiatePayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if neither paymentLinkId nor slug provided', async () => {
      const invalidDto = {
        customerName: 'Test Customer',
        customerPhone: '612345678',
        paymentProvider: PaymentProvider.MTN,
      };

      await expect(
        service.initiatePayment(invalidDto as any, 'key-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if both paymentLinkId and slug provided', async () => {
      const invalidDto = {
        paymentLinkId: 'link-123',
        slug: 'test-slug',
        customerName: 'Test Customer',
        customerPhone: '612345678',
        paymentProvider: PaymentProvider.MTN,
      };

      await expect(
        service.initiatePayment(invalidDto as any, 'key-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment link not found', async () => {
      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        null,
      );
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(null);

      await expect(
        service.initiatePayment(initiatePaymentDto, 'key-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment link is not active', async () => {
      const inactiveLink = { ...mockPaymentLink, isActive: false };

      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        null,
      );
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(inactiveLink);

      await expect(
        service.initiatePayment(initiatePaymentDto, 'key-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment link has expired', async () => {
      const expiredLink = {
        ...mockPaymentLink,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      };

      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        null,
      );
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(expiredLink);

      await expect(
        service.initiatePayment(initiatePaymentDto, 'key-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment link reached max uses', async () => {
      const maxedLink = {
        ...mockPaymentLink,
        maxUses: 10,
        currentUses: 10,
      };

      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        null,
      );
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(maxedLink);

      await expect(
        service.initiatePayment(initiatePaymentDto, 'key-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should normalize phone number to +237 format', async () => {
      const dtoWithLocalPhone = {
        ...initiatePaymentDto,
        customerPhone: '0612345678', // Local format
      };
      const mockTransaction = {
        id: 'txn-123',
        externalReference: 'TXN-123',
        status: TransactionStatus.PENDING,
        paymentLink: mockPaymentLink,
      };

      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        null,
      );
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(
        mockPaymentLink,
      );
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
      (mansaTransfersService.initiatePayment as jest.Mock).mockResolvedValue({
        providerTransactionId: 'PROV-TXN-123',
        status: 'PENDING',
      });
      mockPrismaService.transaction.update.mockResolvedValue(mockTransaction);
      mockPrismaService.paymentLink.update.mockResolvedValue({
        ...mockPaymentLink,
        currentUses: 1,
      });
      (idempotencyService.storeResponse as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.initiatePayment(dtoWithLocalPhone, 'key-123');

      expect(mansaTransfersService.initiatePayment).toHaveBeenCalledWith(
        expect.any(Number),
        '+237612345678', // Normalized
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should handle provider API failure gracefully', async () => {
      const mockTransaction = {
        id: 'txn-123',
        externalReference: 'TXN-123',
        status: TransactionStatus.PENDING,
        paymentLink: mockPaymentLink,
      };

      (idempotencyService.getStoredResponse as jest.Mock).mockResolvedValue(
        null,
      );
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(
        mockPaymentLink,
      );
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
      (mansaTransfersService.initiatePayment as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );
      mockPrismaService.transaction.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.FAILED,
      });

      // Service should throw BadRequestException on provider API failure
      await expect(
        service.initiatePayment(initiatePaymentDto, 'key-123'),
      ).rejects.toThrow('Failed to initiate payment with provider');

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-123' },
        data: expect.objectContaining({
          status: TransactionStatus.FAILED,
          failureReason: expect.stringContaining('Provider API error'),
        }),
      });
    });
  });

  describe('getPaymentStatusByExternalReference', () => {
    it('should return payment status for valid external reference', async () => {
      const externalReference = 'TXN-123';
      const mockTransaction = {
        id: 'txn-123',
        externalReference,
        status: TransactionStatus.SUCCESS,
        amount: 5000,
        provider: PaymentProvider.MTN,
        customerName: 'Test Customer',
        customerEmail: 'customer@example.com',
        providerTransactionId: 'PROV-123',
        paymentLink: {
          title: 'Test Link',
          product: null,
        },
        user: {
          id: 'user-123',
          name: 'Merchant',
          email: 'merchant@example.com',
        },
      };

      // The implementation uses findUnique, not findFirst
      mockPrismaService.transaction.findUnique.mockResolvedValue(
        mockTransaction,
      );
      // Mock checkPaymentStatus for SUCCESS transactions (won't be called, but just in case)
      (mansaTransfersService.checkPaymentStatus as jest.Mock).mockResolvedValue({
        status: 'SUCCESS',
      });

      const result = await service.getPaymentStatusByExternalReference(
        externalReference,
      );

      expect(result).toHaveProperty('status');
      expect(result.status).toBe(TransactionStatus.SUCCESS);
      expect(mockPrismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { externalReference },
        include: expect.objectContaining({
          paymentLink: expect.any(Object),
          user: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(
        service.getPaymentStatusByExternalReference('INVALID-REF'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

