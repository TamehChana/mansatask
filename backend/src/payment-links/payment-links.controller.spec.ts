import { Test, TestingModule } from '@nestjs/testing';
import { PaymentLinksController } from './payment-links.controller';
import { PaymentLinksService } from './payment-links.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { UpdatePaymentLinkDto } from './dto/update-payment-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PaymentLinksController', () => {
  let controller: PaymentLinksController;
  let paymentLinksService: PaymentLinksService;

  const mockPaymentLinksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentLinksController],
      providers: [
        {
          provide: PaymentLinksService,
          useValue: mockPaymentLinksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PaymentLinksController>(PaymentLinksController);
    paymentLinksService = module.get<PaymentLinksService>(
      PaymentLinksService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a payment link', async () => {
      const createDto: CreatePaymentLinkDto = {
        title: 'Test Payment Link',
        description: 'Test Description',
        amount: 5000,
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockResponse = {
        id: 'link-123',
        title: 'Test Payment Link',
        slug: 'test-payment-link',
        amount: 5000,
        userId: 'user-123',
      };

      mockPaymentLinksService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(mockUser, createDto);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentLinksService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
      expect(mockPaymentLinksService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all payment links for user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockResponse = [
        {
          id: 'link-123',
          title: 'Test Payment Link',
          slug: 'test-payment-link',
          amount: 5000,
        },
      ];

      mockPaymentLinksService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentLinksService.findAll).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockPaymentLinksService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findBySlug', () => {
    it('should return payment link by slug (public endpoint)', async () => {
      const slug = 'test-payment-link';

      const mockResponse = {
        id: 'link-123',
        title: 'Test Payment Link',
        slug: 'test-payment-link',
        amount: 5000,
        isActive: true,
      };

      mockPaymentLinksService.findBySlug.mockResolvedValue(mockResponse);

      const result = await controller.findBySlug(slug);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentLinksService.findBySlug).toHaveBeenCalledWith(slug);
      expect(mockPaymentLinksService.findBySlug).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when payment link not found', async () => {
      const slug = 'non-existent-slug';

      mockPaymentLinksService.findBySlug.mockRejectedValue(
        new NotFoundException('Payment link not found'),
      );

      await expect(controller.findBySlug(slug)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPaymentLinksService.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('should throw BadRequestException when payment link is not active', async () => {
      const slug = 'inactive-link';

      mockPaymentLinksService.findBySlug.mockRejectedValue(
        new BadRequestException('Payment link is not active'),
      );

      await expect(controller.findBySlug(slug)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when payment link has expired', async () => {
      const slug = 'expired-link';

      mockPaymentLinksService.findBySlug.mockRejectedValue(
        new BadRequestException('Payment link has expired'),
      );

      await expect(controller.findBySlug(slug)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return payment link by ID', async () => {
      const linkId = 'link-123';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockResponse = {
        id: 'link-123',
        title: 'Test Payment Link',
        slug: 'test-payment-link',
        amount: 5000,
      };

      mockPaymentLinksService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne(linkId, mockUser);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentLinksService.findOne).toHaveBeenCalledWith(
        linkId,
        mockUser.id,
      );
      expect(mockPaymentLinksService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when payment link not found', async () => {
      const linkId = 'link-not-found';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockPaymentLinksService.findOne.mockRejectedValue(
        new NotFoundException('Payment link not found'),
      );

      await expect(controller.findOne(linkId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own payment link', async () => {
      const linkId = 'link-123';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockPaymentLinksService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have access to this payment link'),
      );

      await expect(controller.findOne(linkId, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update payment link', async () => {
      const linkId = 'link-123';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const updateDto: UpdatePaymentLinkDto = {
        title: 'Updated Title',
      };

      const mockResponse = {
        id: 'link-123',
        title: 'Updated Title',
        slug: 'test-payment-link',
        amount: 5000,
      };

      mockPaymentLinksService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(linkId, mockUser, updateDto);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentLinksService.update).toHaveBeenCalledWith(
        linkId,
        mockUser.id,
        updateDto,
      );
      expect(mockPaymentLinksService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should successfully delete payment link', async () => {
      const linkId = 'link-123';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockResponse = {
        id: 'link-123',
        deletedAt: new Date(),
      };

      mockPaymentLinksService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(linkId, mockUser);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentLinksService.remove).toHaveBeenCalledWith(
        linkId,
        mockUser.id,
      );
      expect(mockPaymentLinksService.remove).toHaveBeenCalledTimes(1);
    });
  });
});


