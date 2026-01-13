import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { BadRequestException } from '@nestjs/common';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let webhooksService: WebhooksService;

  const mockWebhooksService = {
    processPaymentWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    webhooksService = module.get<WebhooksService>(WebhooksService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handlePaymentWebhook', () => {
    it('should successfully process payment webhook', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'txn-123',
        status: 'SUCCESS',
        provider: 'MTN',
        amount: 5000,
      };

      const signature = 'valid-signature';

      const mockResponse = {
        success: true,
        message: 'Webhook processed successfully',
        transactionId: 'txn-123',
      };

      mockWebhooksService.processPaymentWebhook.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.handlePaymentWebhook(webhookDto, signature);

      expect(result).toEqual(mockResponse);
      expect(mockWebhooksService.processPaymentWebhook).toHaveBeenCalledWith(
        webhookDto,
      );
      expect(mockWebhooksService.processPaymentWebhook).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should handle webhook processing errors gracefully', async () => {
      const webhookDto: PaymentWebhookDto = {
        transactionId: 'txn-123',
        status: 'SUCCESS',
        provider: 'MTN',
        amount: 5000,
      };

      const signature = 'valid-signature';

      mockWebhooksService.processPaymentWebhook.mockRejectedValue(
        new BadRequestException('Invalid webhook data'),
      );

      const result = await controller.handlePaymentWebhook(webhookDto, signature);

      // Should return 200 OK even on error to prevent webhook retries
      expect(result).toEqual({
        success: false,
        message: 'Webhook processing failed (logged)',
      });
      expect(mockWebhooksService.processPaymentWebhook).toHaveBeenCalledWith(
        webhookDto,
      );
    });

    it('should process webhook without signature in non-production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const webhookDto: PaymentWebhookDto = {
        transactionId: 'txn-123',
        status: 'SUCCESS',
        provider: 'MTN',
        amount: 5000,
      };

      const mockResponse = {
        success: true,
        message: 'Webhook processed successfully',
      };

      mockWebhooksService.processPaymentWebhook.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.handlePaymentWebhook(webhookDto, undefined);

      expect(result).toEqual(mockResponse);
      expect(mockWebhooksService.processPaymentWebhook).toHaveBeenCalledWith(
        webhookDto,
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});

