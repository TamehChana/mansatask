import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import * as fs from 'fs';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  /**
   * Generate receipt for a transaction
   * POST /receipts/generate/:transactionId
   */
  @Post('generate/:transactionId')
  @UseGuards(JwtAuthGuard)
  async generateReceipt(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: { id: string },
  ) {
    const receipt = await this.receiptsService.generateReceipt(
      transactionId,
      user.id,
    );
    return {
      success: true,
      data: receipt,
      message: 'Receipt generated successfully',
    };
  }

  /**
   * Download receipt PDF by external reference (public)
   * GET /receipts/public/:externalReference/download
   * Must be placed before parameterized routes to ensure correct matching
   */
  @Get('public/:externalReference/download')
  async downloadReceiptByExternalReference(
    @Param('externalReference') externalReference: string,
    @Res() res: Response,
  ) {
    const fileData =
      await this.receiptsService.getReceiptPDFByExternalReference(
        externalReference,
      );

    const receipt =
      await this.receiptsService.getReceiptByExternalReference(
        externalReference,
      );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${receipt.receiptNumber}.pdf"`,
    );

    // Handle both Buffer (S3) and string (local path)
    if (Buffer.isBuffer(fileData)) {
      // S3 file - send buffer directly
      res.send(fileData);
    } else {
      // Local file - stream from path
      const fileStream = fs.createReadStream(fileData);
      fileStream.pipe(res);
    }
  }

  /**
   * Get receipt by transaction ID
   * GET /receipts/:transactionId
   */
  @Get(':transactionId')
  @UseGuards(JwtAuthGuard)
  async getReceipt(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: { id: string },
  ) {
    const receipt = await this.receiptsService.getReceiptByTransactionId(
      transactionId,
      user.id,
    );
    return {
      success: true,
      data: receipt,
    };
  }

  /**
   * Download receipt PDF (authenticated)
   * GET /receipts/:transactionId/download
   */
  @Get(':transactionId/download')
  @UseGuards(JwtAuthGuard)
  async downloadReceipt(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    const fileData = await this.receiptsService.getReceiptPDF(
      transactionId,
      user.id,
    );

    const receipt = await this.receiptsService.getReceiptByTransactionId(
      transactionId,
      user.id,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${receipt.receiptNumber}.pdf"`,
    );

    // Handle both Buffer (S3) and string (local path)
    if (Buffer.isBuffer(fileData)) {
      // S3 file - send buffer directly
      res.send(fileData);
    } else {
      // Local file - stream from path
      const fileStream = fs.createReadStream(fileData);
      fileStream.pipe(res);
    }
  }
}
