import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('should instantiate service with PrismaService dependency', () => {
    const newService = new ProductsService(mockPrismaService);
    expect(newService).toBeInstanceOf(ProductsService);
    expect(mockPrismaService.product).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const baseCreateDto: CreateProductDto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 1000,
    };

    it('should successfully create a product', async () => {
      const createDto = { ...baseCreateDto };
      const mockProduct = {
        id: 'product-123',
        userId,
        ...createDto,
        price: new Prisma.Decimal(createDto.price),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          userId,
          name: createDto.name,
          description: createDto.description,
          price: expect.any(Prisma.Decimal),
        },
      });
    });

    it('should create product with correct price as Decimal', async () => {
      const createDto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 5000.50,
      };
      const mockProduct = {
        id: 'product-123',
        userId,
        ...createDto,
        price: new Prisma.Decimal(createDto.price),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      await service.create(userId, createDto);

      const createCall = mockPrismaService.product.create.mock.calls[0][0];
      expect(createCall.data.price).toBeInstanceOf(Prisma.Decimal);
      expect(createCall.data.price.toString()).toBe('5000.5');
    });

    it('should create product with minimal required fields', async () => {
      const createDto: CreateProductDto = {
        name: 'Minimal Product',
        description: 'Description',
        price: 100,
      };
      const mockProduct = {
        id: 'product-123',
        userId,
        ...createDto,
        price: new Prisma.Decimal(createDto.price),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(userId, createDto);

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    const userId = 'user-123';

    it('should return all products for user', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          userId,
          name: 'Product 1',
          description: 'Description 1',
          price: new Prisma.Decimal(1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'product-2',
          userId,
          name: 'Product 2',
          description: 'Description 2',
          price: new Prisma.Decimal(2000),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when user has no products', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
    });

    it('should exclude soft-deleted products', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          userId,
          name: 'Product 1',
          description: 'Description 1',
          price: new Prisma.Decimal(1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      await service.findAll(userId);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should order products by createdAt descending', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          userId,
          name: 'Product 1',
          price: new Prisma.Decimal(1000),
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'product-2',
          userId,
          name: 'Product 2',
          price: new Prisma.Decimal(2000),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      await service.findAll(userId);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
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
    const productId = 'product-123';

    it('should return product when user owns it', async () => {
      const mockProduct = {
        id: productId,
        userId,
        name: 'Test Product',
        description: 'Test Description',
        price: new Prisma.Decimal(5000),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId, userId);

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: productId,
          deletedAt: null,
        },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(productId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: productId,
          deletedAt: null,
        },
      });
    });

    it('should throw ForbiddenException when user does not own product', async () => {
      const mockProduct = {
        id: productId,
        userId: otherUserId, // Different user
        name: 'Test Product',
        description: 'Test Description',
        price: new Prisma.Decimal(5000),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      await expect(
        service.findOne(productId, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne(productId, userId),
      ).rejects.toThrow('You do not have access to this product');
    });

    it('should exclude soft-deleted products', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(productId, userId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: productId,
          deletedAt: null,
        },
      });
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const productId = 'product-123';
    const mockProduct = {
      id: productId,
      userId,
      name: 'Original Name',
      description: 'Original Description',
      price: new Prisma.Decimal(5000),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    beforeEach(() => {
      // Mock findOne (which is called first to verify ownership)
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
    });

    it('should successfully update product name', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Name',
      };
      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Name',
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(productId, userId, updateDto);

      expect(result).toEqual(updatedProduct);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          name: 'Updated Name',
        },
      });
    });

    it('should successfully update product description', async () => {
      const updateDto: UpdateProductDto = {
        description: 'Updated Description',
      };
      const updatedProduct = {
        ...mockProduct,
        description: 'Updated Description',
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(productId, userId, updateDto);

      expect(result).toEqual(updatedProduct);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          description: 'Updated Description',
        },
      });
    });

    it('should successfully update product price', async () => {
      const updateDto: UpdateProductDto = {
        price: 10000,
      };
      const updatedProduct = {
        ...mockProduct,
        price: new Prisma.Decimal(10000),
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(productId, userId, updateDto);

      expect(result).toEqual(updatedProduct);
      const updateCall = mockPrismaService.product.update.mock.calls[0][0];
      expect(updateCall.data.price).toBeInstanceOf(Prisma.Decimal);
    });

    it('should update multiple fields at once', async () => {
      const updateDto: UpdateProductDto = {
        name: 'New Name',
        description: 'New Description',
        price: 15000,
      };
      const updatedProduct = {
        ...mockProduct,
        name: 'New Name',
        description: 'New Description',
        price: new Prisma.Decimal(15000),
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(productId, userId, updateDto);

      expect(result).toEqual(updatedProduct);
      const updateCall = mockPrismaService.product.update.mock.calls[0][0];
      expect(updateCall.data.name).toBe('New Name');
      expect(updateCall.data.description).toBe('New Description');
      expect(updateCall.data.price).toBeInstanceOf(Prisma.Decimal);
    });

    it('should not update fields that are undefined', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Name',
        // description and price are undefined
      };
      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Name',
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      await service.update(productId, userId, updateDto);

      const updateCall = mockPrismaService.product.update.mock.calls[0][0];
      expect(updateCall.data.name).toBe('Updated Name');
      expect(updateCall.data.description).toBeUndefined();
      expect(updateCall.data.price).toBeUndefined();
    });

    it('should update only description when provided', async () => {
      const updateDto: UpdateProductDto = {
        description: 'Updated Description',
      };
      const updatedProduct = {
        ...mockProduct,
        description: 'Updated Description',
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      await service.update(productId, userId, updateDto);

      const updateCall = mockPrismaService.product.update.mock.calls[0][0];
      expect(updateCall.data.name).toBeUndefined();
      expect(updateCall.data.description).toBe('Updated Description');
      expect(updateCall.data.price).toBeUndefined();
    });

    it('should update only price when provided', async () => {
      const updateDto: UpdateProductDto = {
        price: 7500,
      };
      const updatedProduct = {
        ...mockProduct,
        price: new Prisma.Decimal(7500),
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      await service.update(productId, userId, updateDto);

      const updateCall = mockPrismaService.product.update.mock.calls[0][0];
      expect(updateCall.data.name).toBeUndefined();
      expect(updateCall.data.description).toBeUndefined();
      expect(updateCall.data.price).toBeInstanceOf(Prisma.Decimal);
    });

    it('should handle empty update DTO (no fields to update)', async () => {
      const updateDto: UpdateProductDto = {};
      const updatedProduct = {
        ...mockProduct,
      };

      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      await service.update(productId, userId, updateDto);

      const updateCall = mockPrismaService.product.update.mock.calls[0][0];
      expect(updateCall.data).toEqual({});
    });

    it('should throw NotFoundException if product not found (via findOne)', async () => {
      const updateDto: UpdateProductDto = {
        name: 'New Name',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update(productId, userId, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own product (via findOne)', async () => {
      const updateDto: UpdateProductDto = {
        name: 'New Name',
      };
      const otherUserProduct = {
        ...mockProduct,
        userId: 'other-user',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(otherUserProduct);

      await expect(
        service.update(productId, userId, updateDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const userId = 'user-123';
    const productId = 'product-123';
    const mockProduct = {
      id: productId,
      userId,
      name: 'Test Product',
      description: 'Test Description',
      price: new Prisma.Decimal(5000),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('should successfully soft delete product', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
      });

      const result = await service.remove(productId, userId);

      expect(result).toEqual({
        message: 'Product deleted successfully',
      });
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if product not found (via findOne)', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(productId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own product (via findOne)', async () => {
      const otherUserProduct = {
        ...mockProduct,
        userId: 'other-user',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(otherUserProduct);

      await expect(
        service.remove(productId, userId),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
    });

    it('should set deletedAt to current date when soft deleting', async () => {
      const beforeDelete = new Date();
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
      });

      await service.remove(productId, userId);

      const updateCall = mockPrismaService.product.update.mock.calls[0][0];
      const deletedAt = updateCall.data.deletedAt;
      expect(deletedAt).toBeInstanceOf(Date);
      expect(deletedAt.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
    });
  });
});

