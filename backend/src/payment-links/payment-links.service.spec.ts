import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentLinksService } from './payment-links.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { UpdatePaymentLinkDto } from './dto/update-payment-link.dto';
import { Prisma } from '@prisma/client';

describe('PaymentLinksService', () => {
  let service: PaymentLinksService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    paymentLink: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentLinksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PaymentLinksService>(PaymentLinksService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('should instantiate service with PrismaService dependency', () => {
    // Test constructor by verifying service has access to prisma
    // This ensures the constructor branch is covered
    const newService = new PaymentLinksService(mockPrismaService);
    expect(newService).toBeInstanceOf(PaymentLinksService);
    // Verify service can use prisma (indirectly tests constructor)
    expect(mockPrismaService.paymentLink).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const mockProduct = {
      id: 'product-123',
      userId: 'user-123',
      name: 'Test Product',
      deletedAt: null,
    };

    const baseCreateDto: CreatePaymentLinkDto = {
      title: 'Test Payment Link',
      description: 'Test Description',
      amount: 5000,
      isActive: true,
    };

    it('should successfully create a payment link without product', async () => {
      const createDto = { ...baseCreateDto };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null); // Slug is unique
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(mockPaymentLink);
      expect(mockPrismaService.paymentLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: createDto.title,
          description: createDto.description,
          amount: expect.any(Prisma.Decimal),
          slug: expect.stringMatching(/^pay-/),
          isActive: true,
          productId: null,
          expiresAt: null,
          expiresAfterDays: null,
          maxUses: null,
          currentUses: 0,
        }),
        include: {
          product: true,
        },
      });
    });

    it('should successfully create a payment link with product', async () => {
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        productId: 'product-123',
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: 'product-123',
        product: mockProduct,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(mockPaymentLink);
      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'product-123',
          userId,
          deletedAt: null,
        },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        productId: 'product-123',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.product.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.paymentLink.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if product belongs to different user', async () => {
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        productId: 'product-123',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(null); // Not found because userId doesn't match

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if both expiresAfterDays and expiresAt provided', async () => {
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        expiresAfterDays: 30,
        expiresAt: new Date().toISOString(),
      };

      await expect(service.create(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.paymentLink.create).not.toHaveBeenCalled();
    });

    it('should calculate expiresAt from expiresAfterDays', async () => {
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        expiresAfterDays: 7,
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: null,
        product: null,
        expiresAt: new Date(),
        expiresAfterDays: 7,
        maxUses: null,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      expect(createCall.data.expiresAt).toBeInstanceOf(Date);
      expect(createCall.data.expiresAfterDays).toBe(7);
    });

    it('should use expiresAt if provided', async () => {
      const expiresAtDate = new Date('2024-12-31');
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        expiresAt: expiresAtDate.toISOString(),
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: null,
        product: null,
        expiresAt: expiresAtDate,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      expect(createCall.data.expiresAt).toEqual(expiresAtDate);
      expect(createCall.data.expiresAfterDays).toBeNull();
    });

    it('should set maxUses if provided', async () => {
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        maxUses: 10,
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: 10,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      expect(createCall.data.maxUses).toBe(10);
    });

    it('should set isActive to false if provided', async () => {
      const createDto: CreatePaymentLinkDto = {
        ...baseCreateDto,
        isActive: false,
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      expect(createCall.data.isActive).toBe(false);
    });

    it('should use default isActive true when not provided', async () => {
      const createDto: CreatePaymentLinkDto = {
        title: 'Test Payment Link',
        description: 'Test Description',
        amount: 5000,
        // isActive not provided - should default to true
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      expect(createCall.data.isActive).toBe(true);
    });

    it('should handle undefined description', async () => {
      const createDto: CreatePaymentLinkDto = {
        title: 'Test Payment Link',
        // description not provided
        amount: 5000,
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        title: createDto.title,
        description: null,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      expect(createCall.data.description).toBeNull();
    });

    it('should handle all || null operators with truthy values', async () => {
      const createDto: CreatePaymentLinkDto = {
        title: 'Test Payment Link',
        description: 'Test Description', // Truthy
        amount: 5000,
        productId: 'product-123', // Truthy
        expiresAfterDays: 30, // Truthy
        maxUses: 10, // Truthy
      };
      const mockProduct = {
        id: 'product-123',
        userId,
        name: 'Test Product',
        deletedAt: null,
      };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-abc123',
        product: mockProduct,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      // Test that truthy values are used (not null)
      expect(createCall.data.productId).toBe('product-123');
      expect(createCall.data.description).toBe('Test Description');
      expect(createCall.data.expiresAfterDays).toBe(30);
      expect(createCall.data.maxUses).toBe(10);
    });

    it('should generate unique slug when slug collision occurs', async () => {
      const createDto = { ...baseCreateDto };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-timestamp123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // First 9 attempts return existing slug, 10th attempt succeeds
      mockPrismaService.paymentLink.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 1
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 2
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 3
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 4
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 5
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 6
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 7
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 8
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 9
        .mockResolvedValueOnce(null); // Attempt 10 - unique

      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      expect(mockPrismaService.paymentLink.findUnique).toHaveBeenCalledTimes(
        10,
      );
      expect(mockPrismaService.paymentLink.create).toHaveBeenCalled();
    });

    it('should use fallback slug generation after max attempts', async () => {
      const createDto = { ...baseCreateDto };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-timestamp123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // All 10 attempts return existing slug (testing the !isUnique branch after max attempts)
      mockPrismaService.paymentLink.findUnique.mockResolvedValue({
        id: 'existing',
      });
      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      expect(mockPrismaService.paymentLink.findUnique).toHaveBeenCalledTimes(
        10,
      );
      expect(mockPrismaService.paymentLink.create).toHaveBeenCalled();
      const createCall = mockPrismaService.paymentLink.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^pay-[a-z0-9]+$/);
      // Verify fallback slug format (timestamp-based)
      expect(createCall.data.slug.length).toBeGreaterThan('pay-'.length);
    });

    it('should handle edge case where slug becomes unique exactly at max attempts', async () => {
      const createDto = { ...baseCreateDto };
      const mockPaymentLink = {
        id: 'link-123',
        userId,
        ...createDto,
        amount: new Prisma.Decimal(createDto.amount),
        slug: 'pay-unique123',
        productId: null,
        product: null,
        expiresAt: null,
        expiresAfterDays: null,
        maxUses: null,
        currentUses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // First 9 attempts return existing, 10th attempt finds unique (testing loop exit condition)
      mockPrismaService.paymentLink.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 1
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 2
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 3
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 4
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 5
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 6
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 7
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 8
        .mockResolvedValueOnce({ id: 'existing' }) // Attempt 9
        .mockResolvedValueOnce(null); // Attempt 10 - unique found

      mockPrismaService.paymentLink.create.mockResolvedValue(mockPaymentLink);

      await service.create(userId, createDto);

      expect(mockPrismaService.paymentLink.findUnique).toHaveBeenCalledTimes(
        10,
      );
      expect(mockPrismaService.paymentLink.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';

    it('should return all payment links for user', async () => {
      const mockPaymentLinks = [
        {
          id: 'link-1',
          userId,
          title: 'Link 1',
          amount: new Prisma.Decimal(1000),
          product: null,
          createdAt: new Date(),
        },
        {
          id: 'link-2',
          userId,
          title: 'Link 2',
          amount: new Prisma.Decimal(2000),
          product: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.paymentLink.findMany.mockResolvedValue(
        mockPaymentLinks,
      );

      const result = await service.findAll(userId);

      expect(result).toEqual(mockPaymentLinks);
      expect(mockPrismaService.paymentLink.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when user has no payment links', async () => {
      mockPrismaService.paymentLink.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });

    it('should exclude soft-deleted payment links', async () => {
      const mockPaymentLinks = [
        {
          id: 'link-1',
          userId,
          title: 'Link 1',
          amount: new Prisma.Decimal(1000),
          product: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.paymentLink.findMany.mockResolvedValue(
        mockPaymentLinks,
      );

      await service.findAll(userId);

      expect(mockPrismaService.paymentLink.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    const userId = 'user-123';
    const otherUserId = 'user-456';
    const paymentLinkId = 'link-123';

    it('should return payment link when user owns it', async () => {
      const mockPaymentLink = {
        id: paymentLinkId,
        userId,
        title: 'Test Link',
        amount: new Prisma.Decimal(5000),
        product: null,
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findFirst.mockResolvedValue(
        mockPaymentLink,
      );

      const result = await service.findOne(paymentLinkId, userId);

      expect(result).toEqual(mockPaymentLink);
      expect(mockPrismaService.paymentLink.findFirst).toHaveBeenCalledWith({
        where: {
          id: paymentLinkId,
          deletedAt: null,
        },
        include: {
          product: true,
        },
      });
    });

    it('should throw NotFoundException when payment link not found', async () => {
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(paymentLinkId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own payment link', async () => {
      const mockPaymentLink = {
        id: paymentLinkId,
        userId: otherUserId, // Different user
        title: 'Test Link',
        amount: new Prisma.Decimal(5000),
        product: null,
        deletedAt: null,
      };

      mockPrismaService.paymentLink.findFirst.mockResolvedValue(
        mockPaymentLink,
      );

      await expect(
        service.findOne(paymentLinkId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should exclude soft-deleted payment links', async () => {
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(paymentLinkId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.paymentLink.findFirst).toHaveBeenCalledWith({
        where: {
          id: paymentLinkId,
          deletedAt: null,
        },
        include: {
          product: true,
        },
      });
    });
  });

  describe('findBySlug', () => {
    const slug = 'pay-abc123';
    const mockPaymentLink = {
      id: 'link-123',
      userId: 'user-123',
      slug,
      title: 'Test Link',
      amount: new Prisma.Decimal(5000),
      isActive: true,
      expiresAt: null,
      maxUses: null,
      currentUses: 0,
      deletedAt: null,
      product: null,
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    it('should return payment link when valid', async () => {
      mockPrismaService.paymentLink.findUnique.mockResolvedValue(
        mockPaymentLink,
      );

      const result = await service.findBySlug(slug);

      expect(result).toEqual(mockPaymentLink);
      expect(mockPrismaService.paymentLink.findUnique).toHaveBeenCalledWith({
        where: { slug },
        include: {
          product: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when payment link not found', async () => {
      mockPrismaService.paymentLink.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug(slug)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when payment link is not active', async () => {
      const inactiveLink = {
        ...mockPaymentLink,
        isActive: false,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(inactiveLink);

      await expect(service.findBySlug(slug)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findBySlug(slug)).rejects.toThrow(
        'Payment link is not active',
      );
    });

    it('should throw BadRequestException when payment link has expired', async () => {
      const expiredLink = {
        ...mockPaymentLink,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(expiredLink);

      await expect(service.findBySlug(slug)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findBySlug(slug)).rejects.toThrow(
        'Payment link has expired',
      );
    });

    it('should throw BadRequestException when max uses reached', async () => {
      const maxedLink = {
        ...mockPaymentLink,
        maxUses: 10,
        currentUses: 10,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(maxedLink);

      await expect(service.findBySlug(slug)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findBySlug(slug)).rejects.toThrow(
        'Payment link has reached maximum number of uses',
      );
    });

    it('should throw NotFoundException when payment link is soft-deleted', async () => {
      const deletedLink = {
        ...mockPaymentLink,
        deletedAt: new Date(),
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(deletedLink);

      await expect(service.findBySlug(slug)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow payment link when currentUses is less than maxUses', async () => {
      const validLink = {
        ...mockPaymentLink,
        maxUses: 10,
        currentUses: 5,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(validLink);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(validLink);
    });

    it('should allow payment link when expiresAt is in the future', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const validLink = {
        ...mockPaymentLink,
        expiresAt: futureDate,
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(validLink);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(validLink);
    });

    it('should allow payment link when expiresAt is null', async () => {
      const validLink = {
        ...mockPaymentLink,
        expiresAt: null, // No expiration
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(validLink);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(validLink);
    });

    it('should allow payment link when maxUses is null', async () => {
      const validLink = {
        ...mockPaymentLink,
        maxUses: null, // No max uses limit
        currentUses: 100, // Can have any number of uses
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(validLink);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(validLink);
    });

    it('should allow payment link when expiresAt equals current date (not expired)', async () => {
      const now = new Date();
      const validLink = {
        ...mockPaymentLink,
        expiresAt: now, // Exactly now - should not be considered expired
      };

      mockPrismaService.paymentLink.findUnique.mockResolvedValue(validLink);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(validLink);
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const paymentLinkId = 'link-123';
    const mockPaymentLink = {
      id: paymentLinkId,
      userId,
      title: 'Original Title',
      description: 'Original Description',
      amount: new Prisma.Decimal(5000),
      productId: null,
      product: null,
      isActive: true,
      expiresAt: null,
      expiresAfterDays: null,
      maxUses: null,
      currentUses: 0,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Mock findOne (which is called first to verify ownership)
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(
        mockPaymentLink,
      );
    });

    it('should successfully update payment link title', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'Updated Title',
      };
      const updatedLink = {
        ...mockPaymentLink,
        title: 'Updated Title',
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      const result = await service.update(paymentLinkId, userId, updateDto);

      expect(result).toEqual(updatedLink);
      expect(mockPrismaService.paymentLink.update).toHaveBeenCalledWith({
        where: { id: paymentLinkId },
        data: {
          title: 'Updated Title',
        },
        include: {
          product: true,
        },
      });
    });

    it('should successfully update payment link description', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        description: 'Updated Description',
      };
      const updatedLink = {
        ...mockPaymentLink,
        description: 'Updated Description',
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      const result = await service.update(paymentLinkId, userId, updateDto);

      expect(result).toEqual(updatedLink);
      expect(mockPrismaService.paymentLink.update).toHaveBeenCalledWith({
        where: { id: paymentLinkId },
        data: {
          description: 'Updated Description',
        },
        include: {
          product: true,
        },
      });
    });

    it('should successfully update payment link amount', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        amount: 10000,
      };
      const updatedLink = {
        ...mockPaymentLink,
        amount: new Prisma.Decimal(10000),
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      const result = await service.update(paymentLinkId, userId, updateDto);

      expect(result).toEqual(updatedLink);
      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.amount).toBeInstanceOf(Prisma.Decimal);
    });

    it('should successfully connect product when productId provided', async () => {
      const mockProduct = {
        id: 'product-123',
        userId,
        name: 'Test Product',
        deletedAt: null,
      };
      const updateDto: UpdatePaymentLinkDto = {
        productId: 'product-123',
      };
      const updatedLink = {
        ...mockPaymentLink,
        productId: 'product-123',
        product: mockProduct,
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      const result = await service.update(paymentLinkId, userId, updateDto);

      expect(result).toEqual(updatedLink);
      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.product).toEqual({
        connect: { id: 'product-123' },
      });
    });

    it('should successfully disconnect product when productId is null', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        productId: null,
      };
      const updatedLink = {
        ...mockPaymentLink,
        productId: null,
        product: null,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      const result = await service.update(paymentLinkId, userId, updateDto);

      expect(result).toEqual(updatedLink);
      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.product).toEqual({
        disconnect: true,
      });
    });

    it('should throw NotFoundException if product not found when updating productId', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        productId: 'product-123',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update(paymentLinkId, userId, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.paymentLink.update).not.toHaveBeenCalled();
    });

    it('should skip product validation when productId is undefined in update', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'Updated Title',
        // productId is undefined (not provided)
      };
      const updatedLink = {
        ...mockPaymentLink,
        title: 'Updated Title',
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      // Should not call product.findFirst when productId is undefined
      expect(mockPrismaService.product.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.paymentLink.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if both expiresAfterDays and expiresAt provided', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        expiresAfterDays: 30,
        expiresAt: new Date().toISOString(),
      };

      await expect(
        service.update(paymentLinkId, userId, updateDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.paymentLink.update).not.toHaveBeenCalled();
    });

    it('should update expiresAfterDays and recalculate expiresAt', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        expiresAfterDays: 14,
      };
      const updatedLink = {
        ...mockPaymentLink,
        expiresAfterDays: 14,
        expiresAt: new Date(),
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.expiresAfterDays).toBe(14);
      expect(updateCall.data.expiresAt).toBeInstanceOf(Date);
    });

    it('should clear expiresAfterDays and expiresAt when expiresAfterDays is null', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        expiresAfterDays: null,
      };
      const updatedLink = {
        ...mockPaymentLink,
        expiresAfterDays: null,
        expiresAt: null,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.expiresAfterDays).toBeNull();
      expect(updateCall.data.expiresAt).toBeNull();
    });

    it('should handle falsy expiresAfterDays value (edge case)', async () => {
      // Testing the branch where expiresAfterDays is falsy (0, false, etc.)
      // This tests the else branch in: if (updatePaymentLinkDto.expiresAfterDays) { ... } else { ... }
      const updateDto: any = {
        expiresAfterDays: 0, // Falsy value (though DTO validation should prevent this)
      };
      const updatedLink = {
        ...mockPaymentLink,
        expiresAfterDays: null,
        expiresAt: null,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      // When expiresAfterDays is 0, it becomes null due to || null
      expect(updateCall.data.expiresAfterDays).toBeNull();
      expect(updateCall.data.expiresAt).toBeNull();
    });

    it('should handle || null operators in update with truthy values', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        expiresAfterDays: 30, // Truthy
        maxUses: 20, // Truthy
      };
      const updatedLink = {
        ...mockPaymentLink,
        expiresAfterDays: 30,
        maxUses: 20,
        expiresAt: new Date(),
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      // Test that truthy values are used (not null)
      expect(updateCall.data.expiresAfterDays).toBe(30);
      expect(updateCall.data.maxUses).toBe(20);
    });

    it('should update expiresAt when provided', async () => {
      const expiresAtDate = new Date('2024-12-31');
      const updateDto: UpdatePaymentLinkDto = {
        expiresAt: expiresAtDate.toISOString(),
      };
      const updatedLink = {
        ...mockPaymentLink,
        expiresAt: expiresAtDate,
        expiresAfterDays: null,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.expiresAt).toEqual(expiresAtDate);
      expect(updateCall.data.expiresAfterDays).toBeNull();
    });

    it('should clear expiresAt when expiresAt is null', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        expiresAt: null,
      };
      const updatedLink = {
        ...mockPaymentLink,
        expiresAt: null,
        expiresAfterDays: null,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.expiresAt).toBeNull();
      expect(updateCall.data.expiresAfterDays).toBeNull();
    });

    it('should update maxUses when provided', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        maxUses: 20,
      };
      const updatedLink = {
        ...mockPaymentLink,
        maxUses: 20,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.maxUses).toBe(20);
    });

    it('should clear maxUses when maxUses is null', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        maxUses: null,
      };
      const updatedLink = {
        ...mockPaymentLink,
        maxUses: null,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.maxUses).toBeNull();
    });

    it('should update isActive when provided', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        isActive: false,
      };
      const updatedLink = {
        ...mockPaymentLink,
        isActive: false,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.isActive).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'New Title',
        description: 'New Description',
        amount: 15000,
        isActive: false,
      };
      const updatedLink = {
        ...mockPaymentLink,
        title: 'New Title',
        description: 'New Description',
        amount: new Prisma.Decimal(15000),
        isActive: false,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.title).toBe('New Title');
      expect(updateCall.data.description).toBe('New Description');
      expect(updateCall.data.amount).toBeInstanceOf(Prisma.Decimal);
      expect(updateCall.data.isActive).toBe(false);
    });

    it('should not update fields that are undefined', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'New Title',
        // description, amount, etc. are undefined - should not be in update data
      };
      const updatedLink = {
        ...mockPaymentLink,
        title: 'New Title',
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.title).toBe('New Title');
      expect(updateCall.data.description).toBeUndefined();
      expect(updateCall.data.amount).toBeUndefined();
    });

    it('should set description to null when explicitly set to null in update', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        description: null as any, // Explicitly null
      };
      const updatedLink = {
        ...mockPaymentLink,
        description: null,
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      expect(updateCall.data.description).toBeNull();
    });

    it('should skip productId update block when productId is undefined', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'Updated Title',
        // productId is undefined (not in DTO)
      };
      const updatedLink = {
        ...mockPaymentLink,
        title: 'Updated Title',
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      // product should not be in updateData when productId is undefined
      expect(updateCall.data.product).toBeUndefined();
    });

    it('should skip expiresAt update block when expiresAt is undefined', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'Updated Title',
        // expiresAt is undefined (not in DTO)
      };
      const updatedLink = {
        ...mockPaymentLink,
        title: 'Updated Title',
      };

      mockPrismaService.paymentLink.update.mockResolvedValue(updatedLink);

      await service.update(paymentLinkId, userId, updateDto);

      const updateCall = mockPrismaService.paymentLink.update.mock.calls[0][0];
      // expiresAt should not be in updateData when expiresAt is undefined
      // (unless expiresAfterDays is also being updated)
      if (!updateCall.data.expiresAfterDays) {
        expect(updateCall.data.expiresAt).toBeUndefined();
      }
    });

    it('should throw NotFoundException if payment link not found (via findOne)', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'New Title',
      };

      mockPrismaService.paymentLink.findFirst.mockResolvedValue(null);

      await expect(
        service.update(paymentLinkId, userId, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.paymentLink.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own payment link (via findOne)', async () => {
      const updateDto: UpdatePaymentLinkDto = {
        title: 'New Title',
      };
      const otherUserLink = {
        ...mockPaymentLink,
        userId: 'other-user',
      };

      mockPrismaService.paymentLink.findFirst.mockResolvedValue(otherUserLink);

      await expect(
        service.update(paymentLinkId, userId, updateDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.paymentLink.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const userId = 'user-123';
    const paymentLinkId = 'link-123';
    const mockPaymentLink = {
      id: paymentLinkId,
      userId,
      title: 'Test Link',
      amount: new Prisma.Decimal(5000),
      deletedAt: null,
    };

    it('should successfully soft delete payment link', async () => {
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(
        mockPaymentLink,
      );
      mockPrismaService.paymentLink.update.mockResolvedValue({
        ...mockPaymentLink,
        deletedAt: new Date(),
        isActive: false,
      });

      const result = await service.remove(paymentLinkId, userId);

      expect(result).toEqual({
        message: 'Payment link deleted successfully',
      });
      expect(mockPrismaService.paymentLink.update).toHaveBeenCalledWith({
        where: { id: paymentLinkId },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      });
    });

    it('should throw NotFoundException if payment link not found (via findOne)', async () => {
      mockPrismaService.paymentLink.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(paymentLinkId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.paymentLink.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own payment link (via findOne)', async () => {
      const otherUserLink = {
        ...mockPaymentLink,
        userId: 'other-user',
      };

      mockPrismaService.paymentLink.findFirst.mockResolvedValue(otherUserLink);

      await expect(
        service.remove(paymentLinkId, userId),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.paymentLink.update).not.toHaveBeenCalled();
    });
  });
});

