import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { TransactionStatus, PaymentProvider, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all transactions for a user (with filters and pagination)
   */
  async findAll(userId: string, listTransactionsDto: ListTransactionsDto) {
    const {
      status,
      provider,
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = listTransactionsDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          paymentLink: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Normalize amounts to numbers for API response (Prisma Decimal -> number)
    const normalizedTransactions = transactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    }));

    return {
      data: normalizedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find a single transaction by ID (with ownership check)
   */
  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
      },
      include: {
        paymentLink: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Authorization check: User must own the transaction
    if (transaction.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this transaction',
      );
    }

    return transaction;
  }
}



