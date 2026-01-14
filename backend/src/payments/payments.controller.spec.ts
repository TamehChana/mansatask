import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  const mockPaymentsService = {
    initiatePayment: jest.fn(),
    getPaymentStatusByExternalReference: jest.fn(),
    getPaymentById: jest.fn(),
    checkApiHealth: jest.fn(),
    getApiLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(PaymentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initiatePayment', () => {
    it('should successfully initiate payment with idempotency key', async () => {
      const initiatePaymentDto: InitiatePaymentDto = {
        paymentLinkSlug: 'test-slug',
        customerName: 'Test Customer',
        customerPhone: '+237612345678',
        customerEmail: 'customer@example.com',
        provider: 'MTN',
      };

      const idempotencyKey = 'idempotency-key-123';

      const mockResponse = {
        transactionId: 'txn-123',
        externalReference: 'TXN-123',
        status: 'PENDING',
        paymentUrl: 'https://payment.url',
      };

      mockPaymentsService.initiatePayment.mockResolvedValue(mockResponse);

      const result = await controller.initiatePayment(
        initiatePaymentDto,
        idempotencyKey,
      );

      expect(result).toEqual(mockResponse);
      expect(mockPaymentsService.initiatePayment).toHaveBeenCalledWith(
        initiatePaymentDto,
        idempotencyKey,
      );
      expect(mockPaymentsService.initiatePayment).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when idempotency key is missing', async () => {
      const initiatePaymentDto: InitiatePaymentDto = {
        paymentLinkSlug: 'test-slug',
        customerName: 'Test Customer',
        customerPhone: '+237612345678',
        customerEmail: 'customer@example.com',
        provider: 'MTN',
      };

      await expect(
        controller.initiatePayment(initiatePaymentDto, undefined),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.initiatePayment(initiatePaymentDto, undefined),
      ).rejects.toThrow('Idempotency-Key header is required');
      expect(mockPaymentsService.initiatePayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when idempotency key is empty', async () => {
      const initiatePaymentDto: InitiatePaymentDto = {
        paymentLinkSlug: 'test-slug',
        customerName: 'Test Customer',
        customerPhone: '+237612345678',
        customerEmail: 'customer@example.com',
        provider: 'MTN',
      };

      await expect(
        controller.initiatePayment(initiatePaymentDto, ''),
      ).rejects.toThrow(BadRequestException);
      expect(mockPaymentsService.initiatePayment).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentStatus', () => {
    it('should successfully get payment status by external reference', async () => {
      const externalReference = 'TXN-123';

      const mockResponse = {
        transactionId: 'txn-123',
        externalReference: 'TXN-123',
        status: 'SUCCESS',
        amount: 5000,
      };

      mockPaymentsService.getPaymentStatusByExternalReference.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getPaymentStatus(externalReference);

      expect(result).toEqual(mockResponse);
      expect(
        mockPaymentsService.getPaymentStatusByExternalReference,
      ).toHaveBeenCalledWith(externalReference);
      expect(
        mockPaymentsService.getPaymentStatusByExternalReference,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const externalReference = 'TXN-NOT-FOUND';

      mockPaymentsService.getPaymentStatusByExternalReference.mockRejectedValue(
        new NotFoundException('Transaction not found'),
      );

      await expect(
        controller.getPaymentStatus(externalReference),
      ).rejects.toThrow(NotFoundException);
      expect(
        mockPaymentsService.getPaymentStatusByExternalReference,
      ).toHaveBeenCalledWith(externalReference);
    });
  });

  describe('getPaymentById', () => {
    it('should successfully get payment by ID', async () => {
      const paymentId = 'txn-123';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockResponse = {
        id: 'txn-123',
        userId: 'user-123',
        status: 'SUCCESS',
        amount: 5000,
      };

      mockPaymentsService.getPaymentById.mockResolvedValue(mockResponse);

      const result = await controller.getPaymentById(paymentId, mockUser);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentsService.getPaymentById).toHaveBeenCalledWith(
        paymentId,
        mockUser.id,
      );
      expect(mockPaymentsService.getPaymentById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when payment not found', async () => {
      const paymentId = 'txn-not-found';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockPaymentsService.getPaymentById.mockRejectedValue(
        new NotFoundException('Payment not found'),
      );

      await expect(
        controller.getPaymentById(paymentId, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockPaymentsService.getPaymentById).toHaveBeenCalledWith(
        paymentId,
        mockUser.id,
      );
    });
  });

  describe('checkApiHealth', () => {
    it('should successfully check API health', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };

      mockPaymentsService.checkApiHealth.mockResolvedValue(mockResponse);

      const result = await controller.checkApiHealth();

      expect(result).toEqual(mockResponse);
      expect(mockPaymentsService.checkApiHealth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getApiLogs', () => {
    it('should successfully get API logs', async () => {
      const mockResponse = {
        logs: [
          {
            timestamp: new Date().toISOString(),
            method: 'POST',
            url: '/api/payments',
            status: 200,
          },
        ],
      };

      mockPaymentsService.getApiLogs.mockResolvedValue(mockResponse);

      const result = await controller.getApiLogs();

      expect(result).toEqual(mockResponse);
      expect(mockPaymentsService.getApiLogs).toHaveBeenCalledTimes(1);
    });
  });
});


