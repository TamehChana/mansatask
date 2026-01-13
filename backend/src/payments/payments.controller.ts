import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('payments')
@UseGuards(ThrottlerGuard) // Apply rate limiting to all payment endpoints
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/initiate
   * Initiate payment (public endpoint, no authentication required)
   * Requires: Idempotency-Key header
   * Rate limit: 10 requests per minute (production), 50 per minute (development)
   */
  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Stricter limit for payment initiation
  async initiatePayment(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header is required',
      );
    }

    return this.paymentsService.initiatePayment(
      initiatePaymentDto,
      idempotencyKey,
    );
  }

  /**
   * GET /payments/status/:externalReference
   * Get payment status by external reference (public endpoint, no authentication required)
   */
  @Get('status/:externalReference')
  @HttpCode(HttpStatus.OK)
  async getPaymentStatus(
    @Param('externalReference') externalReference: string,
  ) {
    return this.paymentsService.getPaymentStatusByExternalReference(
      externalReference,
    );
  }

  /**
   * GET /payments/:id
   * Get payment by ID (protected endpoint)
   * Requires: Authentication
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPaymentById(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.getPaymentById(id, user.id);
  }

  /**
   * GET /payments/api/health
   * Check Mansa Transfers API connectivity (for verification)
   * Public endpoint to verify API integration is working
   */
  @Get('api/health')
  @HttpCode(HttpStatus.OK)
  async checkApiHealth() {
    return this.paymentsService.checkApiHealth();
  }

  /**
   * GET /payments/api/logs
   * Get recent API call logs (for verification)
   * Public endpoint to show actual API requests/responses
   */
  @Get('api/logs')
  @HttpCode(HttpStatus.OK)
  async getApiLogs() {
    return this.paymentsService.getApiLogs();
  }
}


