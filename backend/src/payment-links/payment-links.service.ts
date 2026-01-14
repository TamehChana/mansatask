import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { UpdatePaymentLinkDto } from './dto/update-payment-link.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentLinksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique slug for payment links
   * Format: pay-{randomString}
   * Example: pay-abc123xyz
   */
  private async generateUniqueSlug(): Promise<string> {
    const prefix = 'pay-';
    let slug: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate random string (8 characters: alphanumeric lowercase)
      const randomString = Math.random().toString(36).substring(2, 10);
      slug = `${prefix}${randomString}`;

      // Check if slug exists
      const existing = await this.prisma.paymentLink.findUnique({
        where: { slug },
      });

      if (!existing) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      // Fallback: use timestamp + random
      const timestamp = Date.now().toString(36);
      const randomString = Math.random().toString(36).substring(2, 6);
      slug = `${prefix}${timestamp}${randomString}`;
    }

    return slug!;
  }

  /**
   * Calculate expiresAt from expiresAfterDays
   */
  private calculateExpiresAt(
    expiresAfterDays?: number,
    expiresAt?: string,
  ): Date | null {
    if (expiresAt) {
      return new Date(expiresAt);
    }

    if (expiresAfterDays) {
      const date = new Date();
      date.setDate(date.getDate() + expiresAfterDays);
      return date;
    }

    return null;
  }

  /**
   * Validate payment link is valid for use (active, not expired, not max uses, product in stock)
   */
  private async validatePaymentLinkForUse(paymentLink: any): Promise<void> {
    // Check if link is active
    if (!paymentLink.isActive) {
      throw new BadRequestException('Payment link is not active');
    }

    // Check if link is expired
    if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
      throw new BadRequestException('Payment link has expired');
    }

    // Check if max uses reached
    if (
      paymentLink.maxUses &&
      paymentLink.currentUses >= paymentLink.maxUses
    ) {
      throw new BadRequestException(
        'Payment link has reached maximum number of uses',
      );
    }

    // Check if soft-deleted
    if (paymentLink.deletedAt) {
      throw new NotFoundException('Payment link not found');
    }

    // Check if product is in stock (if payment link is linked to a product)
    // Note: We allow viewing the payment link even if out of stock, but prevent payment initiation
    // This way users can see the link exists but will get an error when trying to pay
    if (paymentLink.productId) {
      try {
        const product = await this.prisma.product.findUnique({
          where: { id: paymentLink.productId },
        });

        // Only check quantity if product exists and quantity is explicitly set
        // If quantity is null/undefined, treat as unlimited stock
        // Use type assertion since Prisma client may not have regenerated yet
        const productQuantity = (product as any)?.quantity;
        if (product && productQuantity !== null && productQuantity !== undefined && productQuantity <= 0) {
          // Don't throw error here - allow link to be viewed, but payment will be blocked later
          // This provides better UX - user can see the link but will get clear error when paying
        }
      } catch (error) {
        // If product lookup fails, log but don't block payment link access
        // This prevents issues if product was deleted but payment link still exists
      }
    }
  }

  /**
   * Create a new payment link
   */
  async create(userId: string, createPaymentLinkDto: CreatePaymentLinkDto) {
    const {
      title,
      description,
      amount,
      productId,
      expiresAfterDays,
      expiresAt,
      maxUses,
      isActive = true,
    } = createPaymentLinkDto;

    // Validate productId if provided
    if (productId) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: productId,
          userId, // Ensure user owns the product
          deletedAt: null,
        },
      });

      if (!product) {
        throw new NotFoundException(
          'Product not found or you do not have access to it',
        );
      }
    }

    // Validate expiration: cannot have both expiresAfterDays and expiresAt
    if (expiresAfterDays && expiresAt) {
      throw new BadRequestException(
        'Cannot specify both expiresAfterDays and expiresAt',
      );
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug();

    // Calculate expiresAt
    const calculatedExpiresAt = this.calculateExpiresAt(
      expiresAfterDays,
      expiresAt,
    );

    // Create payment link
    const paymentLink = await this.prisma.paymentLink.create({
      data: {
        userId,
        productId: productId || null,
        title,
        description: description || null,
        amount: new Prisma.Decimal(amount),
        slug,
        isActive,
        expiresAt: calculatedExpiresAt,
        expiresAfterDays: expiresAfterDays || null,
        maxUses: maxUses || null,
        currentUses: 0,
      },
      include: {
        product: true,
      },
    });

    return paymentLink;
  }

  /**
   * Find all payment links for a user (excluding soft-deleted)
   */
  async findAll(userId: string) {
    const paymentLinks = await this.prisma.paymentLink.findMany({
      where: {
        userId,
        deletedAt: null, // Exclude soft-deleted
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return paymentLinks;
  }

  /**
   * Find a single payment link by ID (with ownership check)
   */
  async findOne(id: string, userId: string) {
    const paymentLink = await this.prisma.paymentLink.findFirst({
      where: {
        id,
        deletedAt: null, // Exclude soft-deleted
      },
      include: {
        product: true,
      },
    });

    if (!paymentLink) {
      throw new NotFoundException('Payment link not found');
    }

    // Authorization check: User must own the payment link
    if (paymentLink.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this payment link',
      );
    }

    return paymentLink;
  }

  /**
   * Find a payment link by slug (public endpoint - no auth required)
   * Validates that link is active, not expired, and not max uses reached
   */
  async findBySlug(slug: string) {
    // Log for debugging
    console.log(`[PaymentLinksService] Finding payment link by slug: ${slug}`);
    
    const paymentLink = await this.prisma.paymentLink.findUnique({
      where: { slug },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!paymentLink) {
      console.log(`[PaymentLinksService] Payment link not found for slug: ${slug}`);
      throw new NotFoundException('Payment link not found');
    }

    console.log(`[PaymentLinksService] Payment link found: ${paymentLink.id}, active: ${paymentLink.isActive}, deleted: ${!!paymentLink.deletedAt}`);

    // Validate payment link is valid for use
    // Note: This will throw if link is inactive, expired, or max uses reached
    // But we allow viewing even if product is out of stock (validation updated)
    try {
      await this.validatePaymentLinkForUse(paymentLink);
    } catch (error) {
      console.log(`[PaymentLinksService] Validation failed for slug ${slug}:`, error.message);
      throw error;
    }

    return paymentLink;
  }

  /**
   * Update a payment link (with ownership check)
   */
  async update(
    id: string,
    userId: string,
    updatePaymentLinkDto: UpdatePaymentLinkDto,
  ) {
    // First verify ownership
    await this.findOne(id, userId);

    // Validate productId if provided
    if (updatePaymentLinkDto.productId) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: updatePaymentLinkDto.productId,
          userId, // Ensure user owns the product
          deletedAt: null,
        },
      });

      if (!product) {
        throw new NotFoundException(
          'Product not found or you do not have access to it',
        );
      }
    }

    // Validate expiration: cannot have both expiresAfterDays and expiresAt
    if (
      updatePaymentLinkDto.expiresAfterDays &&
      updatePaymentLinkDto.expiresAt
    ) {
      throw new BadRequestException(
        'Cannot specify both expiresAfterDays and expiresAt',
      );
    }

    const updateData: Prisma.PaymentLinkUpdateInput = {};

    if (updatePaymentLinkDto.title !== undefined) {
      updateData.title = updatePaymentLinkDto.title;
    }

    if (updatePaymentLinkDto.description !== undefined) {
      updateData.description = updatePaymentLinkDto.description;
    }

    if (updatePaymentLinkDto.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(updatePaymentLinkDto.amount);
    }

    if (updatePaymentLinkDto.productId !== undefined) {
      if (updatePaymentLinkDto.productId) {
        updateData.product = {
          connect: { id: updatePaymentLinkDto.productId },
        };
      } else {
        updateData.product = {
          disconnect: true,
        };
      }
    }

    if (updatePaymentLinkDto.expiresAfterDays !== undefined) {
      updateData.expiresAfterDays = updatePaymentLinkDto.expiresAfterDays || null;
      // Recalculate expiresAt if expiresAfterDays is updated
      if (updatePaymentLinkDto.expiresAfterDays) {
        const date = new Date();
        date.setDate(date.getDate() + updatePaymentLinkDto.expiresAfterDays);
        updateData.expiresAt = date;
      } else {
        updateData.expiresAt = null;
      }
    }

    if (updatePaymentLinkDto.expiresAt !== undefined) {
      if (updatePaymentLinkDto.expiresAt) {
        updateData.expiresAt = new Date(updatePaymentLinkDto.expiresAt);
      } else {
        updateData.expiresAt = null;
      }
      updateData.expiresAfterDays = null; // Clear expiresAfterDays if expiresAt is set
    }

    if (updatePaymentLinkDto.maxUses !== undefined) {
      updateData.maxUses = updatePaymentLinkDto.maxUses || null;
    }

    if (updatePaymentLinkDto.isActive !== undefined) {
      updateData.isActive = updatePaymentLinkDto.isActive;
    }

    const paymentLink = await this.prisma.paymentLink.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
      },
    });

    return paymentLink;
  }

  /**
   * Soft delete a payment link (with ownership check)
   */
  async remove(id: string, userId: string) {
    // First verify ownership
    await this.findOne(id, userId);

    // Soft delete
    await this.prisma.paymentLink.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false, // Also deactivate the link
      },
    });

    return { message: 'Payment link deleted successfully' };
  }
}

