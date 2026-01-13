import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product
   */
  async create(userId: string, createProductDto: CreateProductDto) {
    const { name, description, price, imageUrl, quantity } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        userId,
        name,
        description,
        price: new Prisma.Decimal(price),
        imageUrl: imageUrl || null,
        // If quantity is explicitly provided (including 0), use it
        // If quantity is undefined/null (user left field empty), use 999999 for "unlimited"
        quantity: quantity !== undefined && quantity !== null ? quantity : 999999,
      },
    });

    return product;
  }

  /**
   * Find all products for a user (excluding soft-deleted)
   */
  async findAll(userId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        userId,
        deletedAt: null, // Exclude soft-deleted products
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products;
  }

  /**
   * Find a single product by ID (with ownership check)
   */
  async findOne(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null, // Exclude soft-deleted
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Authorization check: User must own the product
    if (product.userId !== userId) {
      throw new ForbiddenException('You do not have access to this product');
    }

    return product;
  }

  /**
   * Update a product (with ownership check)
   */
  async update(id: string, userId: string, updateProductDto: UpdateProductDto) {
    // First verify ownership
    await this.findOne(id, userId);

    const updateData: Prisma.ProductUpdateInput = {};

    if (updateProductDto.name !== undefined) {
      updateData.name = updateProductDto.name;
    }

    if (updateProductDto.description !== undefined) {
      updateData.description = updateProductDto.description;
    }

    if (updateProductDto.price !== undefined) {
      updateData.price = new Prisma.Decimal(updateProductDto.price);
    }

    if (updateProductDto.imageUrl !== undefined) {
      updateData.imageUrl = updateProductDto.imageUrl;
    }

    // Handle quantity: if explicitly provided (including 0), use it
    // If undefined/null (user left field empty), use 999999 for "unlimited"
    if (updateProductDto.quantity !== undefined && updateProductDto.quantity !== null) {
      updateData.quantity = updateProductDto.quantity;
    } else if (updateProductDto.quantity === null || updateProductDto.quantity === undefined) {
      // If quantity is explicitly set to null/undefined, treat as unlimited
      updateData.quantity = 999999;
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    return product;
  }

  /**
   * Soft delete a product (with ownership check)
   */
  async remove(id: string, userId: string) {
    // First verify ownership
    await this.findOne(id, userId);

    // Soft delete
    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Product deleted successfully' };
  }
}



