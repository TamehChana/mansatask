import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: TransactionsService;

  const mockTransactionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get<TransactionsService>(
      TransactionsService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all transactions for user with pagination', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const listDto: ListTransactionsDto = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [
          {
            id: 'txn-123',
            status: 'SUCCESS',
            amount: 5000,
            provider: 'MTN',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockTransactionsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser, listDto);

      expect(result).toEqual(mockResponse);
      expect(mockTransactionsService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        listDto,
      );
      expect(mockTransactionsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should filter transactions by status', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const listDto: ListTransactionsDto = {
        page: 1,
        limit: 10,
        status: 'SUCCESS',
      };

      const mockResponse = {
        data: [
          {
            id: 'txn-123',
            status: 'SUCCESS',
            amount: 5000,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockTransactionsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser, listDto);

      expect(result).toEqual(mockResponse);
      expect(mockTransactionsService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        listDto,
      );
    });

    it('should filter transactions by provider', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const listDto: ListTransactionsDto = {
        page: 1,
        limit: 10,
        provider: 'MTN',
      };

      const mockResponse = {
        data: [
          {
            id: 'txn-123',
            provider: 'MTN',
            amount: 5000,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockTransactionsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser, listDto);

      expect(result).toEqual(mockResponse);
      expect(mockTransactionsService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        listDto,
      );
    });

    it('should return empty array when user has no transactions', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const listDto: ListTransactionsDto = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockTransactionsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser, listDto);

      expect(result).toEqual(mockResponse);
      expect(mockTransactionsService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        listDto,
      );
    });
  });

  describe('findOne', () => {
    it('should return transaction by ID', async () => {
      const transactionId = 'txn-123';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockResponse = {
        id: 'txn-123',
        userId: 'user-123',
        status: 'SUCCESS',
        amount: 5000,
        provider: 'MTN',
      };

      mockTransactionsService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne(transactionId, mockUser);

      expect(result).toEqual(mockResponse);
      expect(mockTransactionsService.findOne).toHaveBeenCalledWith(
        transactionId,
        mockUser.id,
      );
      expect(mockTransactionsService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const transactionId = 'txn-not-found';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockTransactionsService.findOne.mockRejectedValue(
        new NotFoundException('Transaction not found'),
      );

      await expect(
        controller.findOne(transactionId, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockTransactionsService.findOne).toHaveBeenCalledWith(
        transactionId,
        mockUser.id,
      );
    });

    it('should throw ForbiddenException when user does not own transaction', async () => {
      const transactionId = 'txn-123';
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      mockTransactionsService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have access to this transaction'),
      );

      await expect(
        controller.findOne(transactionId, mockUser),
      ).rejects.toThrow(ForbiddenException);
      expect(mockTransactionsService.findOne).toHaveBeenCalledWith(
        transactionId,
        mockUser.id,
      );
    });
  });
});


