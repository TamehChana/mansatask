import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, PaymentProvider, Prisma } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
    paymentLink: {
      count: jest.fn(),
    },
    product: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('should instantiate service with PrismaService dependency', () => {
    const newService = new DashboardService(mockPrismaService);
    expect(newService).toBeInstanceOf(DashboardService);
  });

  describe('getDashboardStats', () => {
    const userId = 'user-123';

    it('should return complete dashboard statistics', async () => {
      const mockTransactions = [
        {
          status: TransactionStatus.SUCCESS,
          amount: new Prisma.Decimal(5000),
        },
        {
          status: TransactionStatus.SUCCESS,
          amount: new Prisma.Decimal(3000),
        },
        {
          status: TransactionStatus.PENDING,
          amount: new Prisma.Decimal(2000),
        },
        {
          status: TransactionStatus.FAILED,
          amount: new Prisma.Decimal(1000),
        },
      ];

      const mockRecentTransactions = [
        {
          id: 'txn-1',
          externalReference: 'TXN-001',
          status: TransactionStatus.SUCCESS,
          provider: PaymentProvider.MTN,
          amount: new Prisma.Decimal(5000),
          customerName: 'Test Customer',
          customerPhone: '+237612345678',
          customerEmail: 'customer@example.com',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce(mockTransactions) // For transaction stats
        .mockResolvedValueOnce(mockRecentTransactions); // For recent transactions
      mockPrismaService.paymentLink.count
        .mockResolvedValueOnce(10) // Total payment links
        .mockResolvedValueOnce(7); // Active payment links
      mockPrismaService.product.count.mockResolvedValue(5);

      const result = await service.getDashboardStats(userId);

      expect(result).toEqual({
        totalRevenue: 8000, // 5000 + 3000 (only SUCCESS)
        totalTransactions: 4,
        successfulTransactions: 2,
        pendingTransactions: 1,
        failedTransactions: 1,
        cancelledTransactions: 0,
        totalPaymentLinks: 10,
        activePaymentLinks: 7,
        totalProducts: 5,
        recentTransactions: [
          {
            id: 'txn-1',
            externalReference: 'TXN-001',
            status: TransactionStatus.SUCCESS,
            provider: PaymentProvider.MTN,
            amount: 5000,
            customerName: 'Test Customer',
            customerPhone: '+237612345678',
            customerEmail: 'customer@example.com',
            createdAt: expect.any(Date),
          },
        ],
      });
    });

    it('should handle empty transactions', async () => {
      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([]) // For transaction stats
        .mockResolvedValueOnce([]); // For recent transactions
      mockPrismaService.paymentLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.product.count.mockResolvedValue(0);

      const result = await service.getDashboardStats(userId);

      expect(result).toEqual({
        totalRevenue: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        cancelledTransactions: 0,
        totalPaymentLinks: 0,
        activePaymentLinks: 0,
        totalProducts: 0,
        recentTransactions: [],
      });
    });

    it('should calculate revenue only from successful transactions', async () => {
      const mockTransactions = [
        {
          status: TransactionStatus.SUCCESS,
          amount: new Prisma.Decimal(10000),
        },
        {
          status: TransactionStatus.PENDING,
          amount: new Prisma.Decimal(5000), // Should not be counted
        },
        {
          status: TransactionStatus.FAILED,
          amount: new Prisma.Decimal(3000), // Should not be counted
        },
        {
          status: TransactionStatus.SUCCESS,
          amount: new Prisma.Decimal(2000),
        },
      ];

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce(mockTransactions)
        .mockResolvedValueOnce([]);
      mockPrismaService.paymentLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.product.count.mockResolvedValue(0);

      const result = await service.getDashboardStats(userId);

      expect(result.totalRevenue).toBe(12000); // Only 10000 + 2000
    });

    it('should count pending and processing transactions together', async () => {
      const mockTransactions = [
        {
          status: TransactionStatus.PENDING,
          amount: new Prisma.Decimal(1000),
        },
        {
          status: TransactionStatus.PROCESSING,
          amount: new Prisma.Decimal(2000),
        },
      ];

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce(mockTransactions)
        .mockResolvedValueOnce([]);
      mockPrismaService.paymentLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.product.count.mockResolvedValue(0);

      const result = await service.getDashboardStats(userId);

      expect(result.pendingTransactions).toBe(2);
    });

    it('should return limited recent transactions', async () => {
      const mockRecentTransactions = Array.from({ length: 5 }, (_, i) => ({
        id: `txn-${i}`,
        externalReference: `TXN-00${i}`,
        status: TransactionStatus.SUCCESS,
        provider: PaymentProvider.MTN,
        amount: new Prisma.Decimal(1000),
        customerName: 'Customer',
        customerPhone: '+237612345678',
        customerEmail: 'customer@example.com',
        createdAt: new Date(),
      }));

      mockPrismaService.transaction.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockRecentTransactions);
      mockPrismaService.paymentLink.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.product.count.mockResolvedValue(0);

      const result = await service.getDashboardStats(userId);

      expect(result.recentTransactions).toHaveLength(5);
    });
  });
});

