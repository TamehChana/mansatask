import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');

describe('ReceiptsController', () => {
  let controller: ReceiptsController;
  let receiptsService: ReceiptsService;

  const mockReceiptsService = {
    generateReceipt: jest.fn(),
    getReceiptByTransactionId: jest.fn(),
    getReceiptPDF: jest.fn(),
    getReceiptByExternalReference: jest.fn(),
    getReceiptPDFByExternalReference: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    pipe: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceiptsController],
      providers: [
        {
          provide: ReceiptsService,
          useValue: mockReceiptsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ReceiptsController>(ReceiptsController);
    receiptsService = module.get<ReceiptsService>(ReceiptsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateReceipt', () => {
    it('should successfully generate receipt', async () => {
      const transactionId = 'txn-123';
      const mockUser = {
        id: 'user-123',
      };

      const mockReceipt = {
        id: 'receipt-123',
        transactionId: 'txn-123',
        receiptNumber: 'RCP-2024-123456',
        pdfUrl: '/receipts/RCP-2024-123456.pdf',
      };

      mockReceiptsService.generateReceipt.mockResolvedValue(mockReceipt);

      const result = await controller.generateReceipt(transactionId, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockReceipt,
        message: 'Receipt generated successfully',
      });
      expect(mockReceiptsService.generateReceipt).toHaveBeenCalledWith(
        transactionId,
        mockUser.id,
      );
      expect(mockReceiptsService.generateReceipt).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const transactionId = 'txn-not-found';
      const mockUser = {
        id: 'user-123',
      };

      mockReceiptsService.generateReceipt.mockRejectedValue(
        new NotFoundException('Transaction not found'),
      );

      await expect(
        controller.generateReceipt(transactionId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when transaction is not successful', async () => {
      const transactionId = 'txn-123';
      const mockUser = {
        id: 'user-123',
      };

      mockReceiptsService.generateReceipt.mockRejectedValue(
        new BadRequestException(
          'Receipt can only be generated for successful transactions',
        ),
      );

      await expect(
        controller.generateReceipt(transactionId, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReceipt', () => {
    it('should successfully get receipt by transaction ID', async () => {
      const transactionId = 'txn-123';
      const mockUser = {
        id: 'user-123',
      };

      const mockReceipt = {
        id: 'receipt-123',
        transactionId: 'txn-123',
        receiptNumber: 'RCP-2024-123456',
      };

      mockReceiptsService.getReceiptByTransactionId.mockResolvedValue(
        mockReceipt,
      );

      const result = await controller.getReceipt(transactionId, mockUser);

      expect(result).toEqual({
        success: true,
        data: mockReceipt,
      });
      expect(mockReceiptsService.getReceiptByTransactionId).toHaveBeenCalledWith(
        transactionId,
        mockUser.id,
      );
    });

    it('should throw NotFoundException when receipt not found', async () => {
      const transactionId = 'txn-not-found';
      const mockUser = {
        id: 'user-123',
      };

      mockReceiptsService.getReceiptByTransactionId.mockRejectedValue(
        new NotFoundException('Receipt not found'),
      );

      await expect(
        controller.getReceipt(transactionId, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('downloadReceipt', () => {
    it('should successfully download receipt PDF', async () => {
      const transactionId = 'txn-123';
      const mockUser = {
        id: 'user-123',
      };

      const filepath = '/path/to/receipt.pdf';
      const mockReceipt = {
        id: 'receipt-123',
        transactionId: 'txn-123',
        receiptNumber: 'RCP-2024-123456',
      };

      const mockFileStream = {
        pipe: jest.fn(),
      };

      mockReceiptsService.getReceiptPDF.mockResolvedValue(filepath);
      mockReceiptsService.getReceiptByTransactionId.mockResolvedValue(
        mockReceipt,
      );
      jest.spyOn(fs, 'createReadStream').mockReturnValue(
        mockFileStream as any,
      );

      await controller.downloadReceipt(transactionId, mockUser, mockResponse);

      expect(mockReceiptsService.getReceiptPDF).toHaveBeenCalledWith(
        transactionId,
        mockUser.id,
      );
      expect(mockReceiptsService.getReceiptByTransactionId).toHaveBeenCalledWith(
        transactionId,
        mockUser.id,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="RCP-2024-123456.pdf"',
      );
      expect(fs.createReadStream).toHaveBeenCalledWith(filepath);
      expect(mockFileStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should throw NotFoundException when PDF file not found', async () => {
      const transactionId = 'txn-123';
      const mockUser = {
        id: 'user-123',
      };

      mockReceiptsService.getReceiptPDF.mockRejectedValue(
        new NotFoundException('Receipt PDF file not found'),
      );

      await expect(
        controller.downloadReceipt(transactionId, mockUser, mockResponse),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('downloadReceiptByExternalReference', () => {
    it('should successfully download receipt PDF by external reference', async () => {
      const externalReference = 'TXN-123';

      const filepath = '/path/to/receipt.pdf';
      const mockReceipt = {
        id: 'receipt-123',
        transactionId: 'txn-123',
        receiptNumber: 'RCP-2024-123456',
      };

      const mockFileStream = {
        pipe: jest.fn(),
      };

      mockReceiptsService.getReceiptPDFByExternalReference.mockResolvedValue(
        filepath,
      );
      mockReceiptsService.getReceiptByExternalReference.mockResolvedValue(
        mockReceipt,
      );
      jest.spyOn(fs, 'createReadStream').mockReturnValue(
        mockFileStream as any,
      );

      await controller.downloadReceiptByExternalReference(
        externalReference,
        mockResponse,
      );

      expect(
        mockReceiptsService.getReceiptPDFByExternalReference,
      ).toHaveBeenCalledWith(externalReference);
      expect(mockReceiptsService.getReceiptByExternalReference).toHaveBeenCalledWith(
        externalReference,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="RCP-2024-123456.pdf"',
      );
      expect(fs.createReadStream).toHaveBeenCalledWith(filepath);
      expect(mockFileStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should throw NotFoundException when receipt not found', async () => {
      const externalReference = 'TXN-NOT-FOUND';

      mockReceiptsService.getReceiptPDFByExternalReference.mockRejectedValue(
        new NotFoundException('Transaction not found'),
      );

      await expect(
        controller.downloadReceiptByExternalReference(
          externalReference,
          mockResponse,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});


