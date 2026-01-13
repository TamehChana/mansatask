import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { EmailService } from '../email/email.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { TransactionStatus, PaymentProvider, Prisma } from '@prisma/client';
import {
  createMockEmailService,
  createMockReceiptsService,
  createMockConfigService,
} from '../common/test/mocks';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let receiptsService: ReceiptsService;
  let emailService: EmailService;
  let configService: ConfigService;

  const mockPrismaService = {
    transaction: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockRedisService = {
    exists: jest.fn(),
    set: jest.fn(),
  };

  const mockReceiptsService = createMockReceiptsService();
  const mockEmailService = createMockEmailService();
  const mockConfigService = createMockConfigService({
    'config.webhook.secret': 'test-webhook-secret',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ReceiptsService,
          useValue: mockReceiptsService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    receiptsService = module.get<ReceiptsService>(ReceiptsService);
    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(redisService).toBeDefined();
  });

  describe('verifySignature', () => {
    it('should return true when signature is valid', async () => {
      const payload = JSON.stringify({ transactionId: 'TXN-123', status: 'SUCCESS' });
      const signature = require('crypto')
        .createHmac('sha256', 'test-webhook-secret')
        .update(payload)
        .digest('hex');

      const result = await service.verifySignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should return false when signature is invalid', async () => {
      const payload = JSON.stringify({ transactionId: 'TXN-123', status: 'SUCCESS' });
      const invalidSignature = 'invalid-signature';

      const result = await service.verifySignature(payload, invalidSignature);

      expect(result).toBe(false);
    });

    it('should return false when signature is missing', async () => {
      const payload = JSON.stringify({ transactionId: 'TXN-123', status: 'SUCCESS' });

      const result = await service.verifySignature(payload, '');

      expect(result).toBe(false);
    });

    it('should allow webhooks in development when secret is not configured', async () => {
      const configWithoutSecret = createMockConfigService({ 'config.webhook.secret': '' });
      const serviceWithoutSecret = new WebhooksService(
        mockPrismaService,
        mockRedisService,
        configWithoutSecret,
        mockReceiptsService,
        mockEmailService,
      );

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const payload = JSON.stringify({ transactionId: 'TXN-123' });
      const result = await serviceWithoutSecret.verifySignature(payload, '');

      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('isDuplicate', () => {
    it('should return true when webhook was already processed', async () => {
      mockRedisService.exists.mockResolvedValue(true);

      const result = await service.isDuplicate('TXN-123');

      expect(result).toBe(true);
      expect(mockRedisService.exists).toHaveBeenCalledWith('webhook:TXN-123');
    });

    it('should return false when webhook was not processed', async () => {
      mockRedisService.exists.mockResolvedValue(false);

      const result = await service.isDuplicate('TXN-123');

      expect(result).toBe(false);
    });
  });

  describe('markAsProcessed', () => {
    it('should mark webhook as processed', async () => {
      mockRedisService.set.mockResolvedValue(undefined);

      await service.markAsProcessed('TXN-123');

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'webhook:TXN-123',
        'processed',
        604800, // 7 days in seconds
      );
    });
  });

  describe('processPaymentWebhook', () => {
    const mockTransaction = {
      id: 'txn-123',
      userId: 'user-123',
      externalReference: 'TXN-123',
      status: TransactionStatus.PENDING,
      provider: PaymentProvider.MTN,
      amount: new Prisma.Decimal(5000),
      customerName: 'Test Customer',
      customerPhone: '+237612345678',
      customerEmail: 'customer@example.com',
      providerTransactionId: 'PROV-TXN-123',
      paymentLink: {
        id: 'link-123',
        title: 'Test Link',
      },
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return duplicate message when webhook was already processed', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.SUCCESS,
      };

      mockRedisService.exists.mockResolvedValue(true);

      const result = await service.processPaymentWebhook(webhookDto);

      expect(result).toEqual({
        success: true,
        message: 'Webhook already processed',
        duplicate: true,
      });
      expect(mockPrismaService.transaction.findFirst).not.toHaveBeenCalled();
    });

    it('should return success when transaction not found (logged)', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-NOT-FOUND',
        status: TransactionStatus.SUCCESS,
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      const result = await service.processPaymentWebhook(webhookDto);

      expect(result).toEqual({
        success: true,
        message: 'Transaction not found (logged)',
      });
    });

    it('should update transaction status on webhook', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.SUCCESS,
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.SUCCESS,
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.processPaymentWebhook(webhookDto);

      expect(result.success).toBe(true);
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-123' },
        data: expect.objectContaining({
          status: TransactionStatus.SUCCESS,
        }),
        include: expect.any(Object),
      });
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should update transaction with failure reason when status is FAILED', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.FAILED,
        failureReason: 'Insufficient funds',
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.FAILED,
        failureReason: 'Insufficient funds',
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);
      mockRedisService.set.mockResolvedValue(undefined);

      await service.processPaymentWebhook(webhookDto);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-123' },
        data: expect.objectContaining({
          status: TransactionStatus.FAILED,
          failureReason: 'Insufficient funds',
        }),
        include: expect.any(Object),
      });
    });

    it('should generate receipt and send email on successful payment', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.SUCCESS,
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.SUCCESS,
      };

      const mockReceipt = {
        id: 'receipt-123',
        transactionId: 'txn-123',
        receiptNumber: 'RCP-001',
        pdfPath: '/path/to/receipt.pdf',
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);
      mockRedisService.set.mockResolvedValue(undefined);
      (mockReceiptsService.generateReceipt as jest.Mock).mockResolvedValue(mockReceipt);
      (mockEmailService.sendPaymentSuccessEmail as jest.Mock).mockResolvedValue(undefined);

      await service.processPaymentWebhook(webhookDto);

      expect(mockReceiptsService.generateReceipt).toHaveBeenCalledWith('txn-123');
      expect(mockEmailService.sendPaymentSuccessEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: 'customer@example.com',
          amount: 5000,
        }),
      );
    });

    it('should send failure email when payment fails', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.FAILED,
        failureReason: 'Payment declined',
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.FAILED,
        failureReason: 'Payment declined',
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);
      mockRedisService.set.mockResolvedValue(undefined);
      (mockEmailService.sendPaymentFailedEmail as jest.Mock).mockResolvedValue(undefined);

      await service.processPaymentWebhook(webhookDto);

      expect(mockEmailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: 'customer@example.com',
          failureReason: 'Payment declined',
        }),
      );
    });

    it('should not send email when customer email is missing', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.SUCCESS,
      };

      const transactionWithoutEmail = {
        ...mockTransaction,
        customerEmail: null,
      };

      const updatedTransaction = {
        ...transactionWithoutEmail,
        status: TransactionStatus.SUCCESS,
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(transactionWithoutEmail);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);
      mockRedisService.set.mockResolvedValue(undefined);
      (mockReceiptsService.generateReceipt as jest.Mock).mockResolvedValue({
        pdfPath: '/path/to/receipt.pdf',
      });

      await service.processPaymentWebhook(webhookDto);

      expect(mockEmailService.sendPaymentSuccessEmail).not.toHaveBeenCalled();
    });

    it('should continue processing even if receipt generation fails', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.SUCCESS,
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.SUCCESS,
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);
      mockRedisService.set.mockResolvedValue(undefined);
      (mockReceiptsService.generateReceipt as jest.Mock).mockRejectedValue(
        new Error('Receipt generation failed'),
      );
      (mockEmailService.sendPaymentSuccessEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await service.processPaymentWebhook(webhookDto);

      expect(result.success).toBe(true);
      // Should still mark as processed
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should continue processing even if email sending fails', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'PROV-TXN-123',
        status: TransactionStatus.SUCCESS,
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.SUCCESS,
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.transaction.update.mockResolvedValue(updatedTransaction);
      mockRedisService.set.mockResolvedValue(undefined);
      (mockReceiptsService.generateReceipt as jest.Mock).mockResolvedValue({
        pdfPath: '/path/to/receipt.pdf',
      });
      (mockEmailService.sendPaymentSuccessEmail as jest.Mock).mockRejectedValue(
        new Error('Email sending failed'),
      );

      const result = await service.processPaymentWebhook(webhookDto);

      expect(result.success).toBe(true);
      // Should still mark as processed
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });
});

