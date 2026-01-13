import { IsOptional, IsEnum, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus, PaymentProvider } from '@prisma/client';

export class ListTransactionsDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

