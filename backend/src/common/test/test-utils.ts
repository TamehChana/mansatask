import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Test utilities for database operations
 */
export class TestUtils {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    });
    // Note: PrismaClient connects lazily on first query, but we can connect explicitly if needed
  }

  /**
   * Ensure database connection is established
   */
  async connect() {
    try {
      await this.prisma.$connect();
    } catch (error) {
      // Connection will be attempted on first query if this fails
      console.warn('TestUtils: Database connection warning:', error);
    }
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    try {
      // Ensure connection is established
      await this.prisma.$connect();
      
      // Delete in order to respect foreign key constraints
      await this.prisma.receipt.deleteMany({});
      await this.prisma.transaction.deleteMany({});
      await this.prisma.paymentLink.deleteMany({});
      await this.prisma.product.deleteMany({});
      await this.prisma.user.deleteMany({});
    } catch (error) {
      // If database doesn't exist or connection fails, log warning but don't throw
      // This allows tests to run even if database setup is incomplete
      console.warn('TestUtils.cleanup(): Database operation failed:', error instanceof Error ? error.message : error);
      // Try to disconnect if connected
      try {
        await this.prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }

  /**
   * Create a test user
   */
  async createTestUser(data?: {
    name?: string;
    email?: string;
    password?: string;
  }) {
    const hashedPassword = data?.password
      ? await require('bcrypt').hash(data.password, 10)
      : await require('bcrypt').hash('TestPassword123!', 10);

    return this.prisma.user.create({
      data: {
        name: data?.name || 'Test User',
        email: data?.email || `test-${Date.now()}@example.com`,
        password: hashedPassword,
      },
    });
  }

  /**
   * Create a test product
   */
  async createTestProduct(userId: string, data?: {
    name?: string;
    description?: string;
    price?: number;
  }) {
    return this.prisma.product.create({
      data: {
        userId,
        name: data?.name || 'Test Product',
        description: data?.description || 'Test Description',
        price: data?.price || 1000,
      },
    });
  }

  /**
   * Create a test payment link
   * Note: userId must exist in the database
   */
  async createTestPaymentLink(userId: string, data?: {
    title?: string;
    description?: string;
    amount?: number;
    slug?: string;
    isActive?: boolean;
    expiresAt?: Date | null;
    maxUses?: number | null;
  }) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new Error(`User with id ${userId} does not exist. Create user first.`);
    }

    return this.prisma.paymentLink.create({
      data: {
        userId,
        title: data?.title || 'Test Payment Link',
        description: data?.description || 'Test Description',
        amount: data?.amount || 5000,
        slug: data?.slug || `test-slug-${Date.now()}`,
        isActive: data?.isActive !== undefined ? data.isActive : true,
        expiresAt: data?.expiresAt,
        maxUses: data?.maxUses,
      },
    });
  }

  /**
   * Create a test transaction
   */
  async createTestTransaction(userId: string, paymentLinkId: string, data?: {
    externalReference?: string;
    providerTransactionId?: string;
    status?: string;
    provider?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    amount?: number;
  }) {
    return this.prisma.transaction.create({
      data: {
        userId,
        paymentLinkId,
        externalReference: data?.externalReference || `TXN-${Date.now()}`,
        providerTransactionId: data?.providerTransactionId || `PROV-${Date.now()}`,
        status: (data?.status as any) || 'PENDING',
        provider: (data?.provider as any) || 'MTN',
        customerName: data?.customerName || 'Test Customer',
        customerPhone: data?.customerPhone || '+237612345678',
        customerEmail: data?.customerEmail || 'customer@example.com',
        amount: data?.amount || 5000,
      },
    });
  }

  /**
   * Get Prisma client
   */
  getPrisma() {
    return this.prisma;
  }

  /**
   * Close database connection
   */
  async close() {
    await this.prisma.$disconnect();
  }
}

