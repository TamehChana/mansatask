import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Price must be greater than 0' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Price is required' })
  price: number;

  @IsString()
  @IsUrl({ require_tld: false }, { message: 'Image URL must be a valid URL' })
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @Min(0, { message: 'Quantity must be 0 or greater' })
  @Type(() => Number)
  @IsOptional()
  quantity?: number; // Available units (0 = out of stock, null/undefined = unlimited)
}



