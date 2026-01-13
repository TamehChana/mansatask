import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class InitiatePaymentDto {
  // Can use either paymentLinkId OR slug (but not both)
  @IsUUID()
  @IsOptional()
  paymentLinkId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^pay-[a-z0-9]+$/, {
    message: 'Slug must be in format pay-{alphanumeric}',
  })
  slug?: string;

  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Customer phone is required' })
  @Matches(/^(\+237|0)[0-9]{9}$/, {
    message: 'Phone number must be in Cameroon format (+237XXXXXXXXX or 0XXXXXXXXX)',
  })
  customerPhone: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsEnum(PaymentProvider, {
    message: 'Payment provider must be one of: MTN, VODAFONE, AIRTELTIGO',
  })
  @IsNotEmpty({ message: 'Payment provider is required' })
  paymentProvider: PaymentProvider;
}

