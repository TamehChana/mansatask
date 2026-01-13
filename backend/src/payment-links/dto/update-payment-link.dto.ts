import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
  IsDateString,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePaymentLinkDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @IsUUID()
  @IsOptional()
  productId?: string;

  // Expiration: Either expiresAfterDays OR expiresAt (not both)
  @IsNumber()
  @Min(1, { message: 'Expires after days must be at least 1' })
  @Max(365, { message: 'Expires after days cannot exceed 365' })
  @Type(() => Number)
  @IsOptional()
  @ValidateIf((o) => !o.expiresAt)
  expiresAfterDays?: number;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => !o.expiresAfterDays)
  expiresAt?: string;

  @IsNumber()
  @Min(1, { message: 'Max uses must be at least 1' })
  @Type(() => Number)
  @IsOptional()
  maxUses?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}



