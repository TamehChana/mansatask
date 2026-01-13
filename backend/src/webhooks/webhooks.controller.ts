import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /webhooks/payment
   * Payment webhook endpoint (public, no authentication required)
   * Requires: Signature verification
   */
  @Post('payment')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Body() webhookDto: PaymentWebhookDto,
    @Headers('x-signature') signature: string,
    @Req() req: Request,
  ) {
    this.logger.log(
      `Received payment webhook: ${webhookDto.transactionId || 'unknown'}`,
    );

    // Verify webhook signature
    // Get raw body from request (Express stores it in req.body as string or Buffer)
    // If body parser is enabled, we need to use the raw body
    // For NestJS, we'll use JSON.stringify of the parsed body as fallback
    // In production, consider using raw-body middleware to get the actual raw body
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // In production, always verify signature if provided
    // In development, allow webhooks without signature for testing
    if (nodeEnv === 'production' || signature) {
      // Get raw body for signature verification
      // Note: If you need the actual raw body (before JSON parsing),
      // you should use a raw-body middleware. For now, we'll use the stringified body.
      const rawBody = (req as any).rawBody || JSON.stringify(webhookDto);
      
      const isValid = await this.webhooksService.verifySignature(
        rawBody,
        signature || '',
      );
      
      if (!isValid) {
        this.logger.warn(
          `Webhook signature verification failed for transaction: ${webhookDto.transactionId || 'unknown'}`,
        );
        throw new UnauthorizedException('Invalid webhook signature');
      }
      
      this.logger.log('Webhook signature verified successfully');
    } else {
      this.logger.log(
        'Skipping signature verification (development mode, no signature provided)',
      );
    }

    // Process webhook
    try {
      const result = await this.webhooksService.processPaymentWebhook(
        webhookDto,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error processing webhook: ${error.message}`,
        error.stack,
      );

      // Return 200 OK even on error to prevent webhook retries
      // Log the error for investigation
      return {
        success: false,
        message: 'Webhook processing failed (logged)',
      };
    }
  }
}

