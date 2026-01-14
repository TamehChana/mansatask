import { IsNotEmpty, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { TransactionStatus, PaymentProvider } from '@prisma/client';

/**
 * Payment Webhook DTO
 * 
 * Expected payload structure from Mansa Transfers API webhook.
 * This structure should be updated based on actual Mansa Transfers API documentation.
 */
export class PaymentWebhookDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string; // Provider's transaction ID

  @IsEnum(TransactionStatus, {
    message: 'Status must be one of: PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED',
  })
  @IsNotEmpty()
  status: TransactionStatus;

  @IsEnum(PaymentProvider, {
    message: 'Provider must be one of: MTN, VODAFONE, AIRTELTIGO',
  })
  @IsOptional()
  provider?: PaymentProvider;

  @IsString()
  @IsOptional()
  externalReference?: string; // Our external reference (if provided by provider)

  @IsString()
  @IsOptional()
  failureReason?: string; // Failure reason if status is FAILED

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>; // Additional metadata from provider

  @IsString()
  @IsOptional()
  timestamp?: string; // Webhook timestamp
}




