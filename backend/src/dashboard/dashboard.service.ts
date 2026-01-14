import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  cancelledTransactions: number;
  totalPaymentLinks: number;
  activePaymentLinks: number;
  totalProducts: number;
  recentTransactions: any[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get all statistics in parallel for better performance
    const [
      transactionStats,
      paymentLinkStats,
      productCount,
      recentTransactions,
    ] = await Promise.all([
      this.getTransactionStats(userId),
      this.getPaymentLinkStats(userId),
      this.getProductCount(userId),
      this.getRecentTransactions(userId, 5),
    ]);

    return {
      totalRevenue: transactionStats.totalRevenue,
      totalTransactions: transactionStats.totalTransactions,
      successfulTransactions: transactionStats.successfulTransactions,
      pendingTransactions: transactionStats.pendingTransactions,
      failedTransactions: transactionStats.failedTransactions,
      cancelledTransactions: transactionStats.cancelledTransactions,
      totalPaymentLinks: paymentLinkStats.total,
      activePaymentLinks: paymentLinkStats.active,
      totalProducts: productCount,
      recentTransactions,
    };
  }

  /**
   * Get transaction statistics for a user
   */
  private async getTransactionStats(userId: string) {
    // Get all transactions for the user
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
      },
      select: {
        status: true,
        amount: true,
      },
    });

    // Calculate statistics
    const totalRevenue = transactions
      .filter((t) => t.status === TransactionStatus.SUCCESS)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const successfulTransactions = transactions.filter(
      (t) => t.status === TransactionStatus.SUCCESS,
    ).length;

    const pendingTransactions = transactions.filter(
      (t) =>
        t.status === TransactionStatus.PENDING ||
        t.status === TransactionStatus.PROCESSING,
    ).length;

    const failedTransactions = transactions.filter(
      (t) => t.status === TransactionStatus.FAILED,
    ).length;

    const cancelledTransactions = transactions.filter(
      (t) => t.status === TransactionStatus.CANCELLED,
    ).length;

    return {
      totalRevenue,
      totalTransactions: transactions.length,
      successfulTransactions,
      pendingTransactions,
      failedTransactions,
      cancelledTransactions,
    };
  }

  /**
   * Get payment link statistics for a user
   */
  private async getPaymentLinkStats(userId: string) {
    const [total, active] = await Promise.all([
      this.prisma.paymentLink.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
      this.prisma.paymentLink.count({
        where: {
          userId,
          isActive: true,
          deletedAt: null,
        },
      }),
    ]);

    return {
      total,
      active,
    };
  }

  /**
   * Get product count for a user
   */
  private async getProductCount(userId: string): Promise<number> {
    return this.prisma.product.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  /**
   * Get recent transactions for a user
   */
  private async getRecentTransactions(userId: string, limit: number = 5) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        externalReference: true,
        status: true,
        provider: true,
        amount: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return transactions.map((t) => ({
      id: t.id,
      externalReference: t.externalReference,
      status: t.status,
      provider: t.provider,
      amount: Number(t.amount),
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      customerEmail: t.customerEmail,
      createdAt: t.createdAt,
    }));
  }
}



