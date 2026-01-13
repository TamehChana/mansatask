import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { TransactionStatus, PaymentProvider, Prisma } from '@prisma/client';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('should instantiate service with PrismaService dependency', () => {
    const newService = new TransactionsService(mockPrismaService);
    expect(newService).toBeInstanceOf(TransactionsService);
  });

  describe('findAll', () => {
    const userId = 'user-123';

    it('should return all transactions for user with default pagination', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          userId,
          externalReference: 'TXN-001',
          status: TransactionStatus.SUCCESS,
          amount: new Prisma.Decimal(5000),
          paymentLink: {
            id: 'link-1',
            title: 'Test Link',
            slug: 'test-slug',
          },
          createdAt: new Date(),
        },
        {
          id: 'txn-2',
          userId,
          externalReference: 'TXN-002',
          status: TransactionStatus.PENDING,
          amount: new Prisma.Decimal(3000),
          paymentLink: {
            id: 'link-2',
            title: 'Test Link 2',
            slug: 'test-slug-2',
          },
          createdAt: new Date(),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(2);

      const listDto: ListTransactionsDto = {};
      const result = await service.findAll(userId, listDto);

      expect(result.data).toEqual(mockTransactions);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
        },
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
        skip: 0,
        take: 20,
      });
    });

    it('should filter transactions by status', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          userId,
          status: TransactionStatus.SUCCESS,
          paymentLink: null,
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const listDto: ListTransactionsDto = {
        status: TransactionStatus.SUCCESS,
      };
      const result = await service.findAll(userId, listDto);

      expect(result.data).toEqual(mockTransactions);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: TransactionStatus.SUCCESS,
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 0,
        take: 20,
      });
    });

    it('should filter transactions by provider', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          userId,
          provider: PaymentProvider.MTN,
          paymentLink: null,
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const listDto: ListTransactionsDto = {
        provider: PaymentProvider.MTN,
      };
      const result = await service.findAll(userId, listDto);

      expect(result.data).toEqual(mockTransactions);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          provider: PaymentProvider.MTN,
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 0,
        take: 20,
      });
    });

    it('should filter transactions by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const mockTransactions = [
        {
          id: 'txn-1',
          userId,
          paymentLink: null,
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const listDto: ListTransactionsDto = {
        startDate,
        endDate,
      };
      const result = await service.findAll(userId, listDto);

      expect(result.data).toEqual(mockTransactions);
      const whereClause = mockPrismaService.transaction.findMany.mock.calls[0][0].where;
      expect(whereClause.createdAt.gte).toBeInstanceOf(Date);
      expect(whereClause.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should handle pagination correctly', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          userId,
          paymentLink: null,
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(50);

      const listDto: ListTransactionsDto = {
        page: 2,
        limit: 10,
      };
      const result = await service.findAll(userId, listDto);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        skip: 10,
        take: 10,
      });
    });

    it('should return empty array when user has no transactions', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.transaction.count.mockResolvedValue(0);

      const listDto: ListTransactionsDto = {};
      const result = await service.findAll(userId, listDto);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should combine multiple filters', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          userId,
          status: TransactionStatus.SUCCESS,
          provider: PaymentProvider.MTN,
          paymentLink: null,
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      const listDto: ListTransactionsDto = {
        status: TransactionStatus.SUCCESS,
        provider: PaymentProvider.MTN,
        page: 1,
        limit: 10,
      };
      const result = await service.findAll(userId, listDto);

      expect(result.data).toEqual(mockTransactions);
      const whereClause = mockPrismaService.transaction.findMany.mock.calls[0][0].where;
      expect(whereClause.userId).toBe(userId);
      expect(whereClause.status).toBe(TransactionStatus.SUCCESS);
      expect(whereClause.provider).toBe(PaymentProvider.MTN);
    });
  });

  describe('findOne', () => {
    const userId = 'user-123';
    const otherUserId = 'user-456';
    const transactionId = 'txn-123';

    it('should return transaction when user owns it', async () => {
      const mockTransaction = {
        id: transactionId,
        userId,
        externalReference: 'TXN-123',
        status: TransactionStatus.SUCCESS,
        amount: new Prisma.Decimal(5000),
        paymentLink: {
          id: 'link-1',
          product: null,
        },
        user: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.findOne(transactionId, userId);

      expect(result).toEqual(mockTransaction);
      expect(mockPrismaService.transaction.findFirst).toHaveBeenCalledWith({
        where: {
          id: transactionId,
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
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(transactionId, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(transactionId, userId),
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw ForbiddenException when user does not own transaction', async () => {
      const mockTransaction = {
        id: transactionId,
        userId: otherUserId, // Different user
        externalReference: 'TXN-123',
        status: TransactionStatus.SUCCESS,
        paymentLink: null,
        user: {
          id: otherUserId,
          name: 'Other User',
          email: 'other@example.com',
        },
      };

      mockPrismaService.transaction.findFirst.mockResolvedValue(mockTransaction);

      await expect(
        service.findOne(transactionId, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne(transactionId, userId),
      ).rejects.toThrow('You do not have access to this transaction');
    });
  });
});

