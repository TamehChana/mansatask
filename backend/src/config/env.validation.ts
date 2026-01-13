import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  Max,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  @IsNotEmpty()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT?: number = 3000;

  // Database
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  // Redis
  @IsString()
  @IsNotEmpty()
  REDIS_URL: string;

  // JWT
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRATION: string = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION: string = '7d';

  // Mansa Transfers API
  @IsUrl()
  @IsNotEmpty()
  MANSA_API_BASE_URL: string = 'https://api-stage.mansatransfers.com';

  @IsString()
  @IsNotEmpty()
  MANSA_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  MANSA_API_SECRET: string;

  // AWS S3 (Optional - falls back to local storage if not provided)
  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET_NAME?: string;

  @IsString()
  @IsOptional()
  AWS_S3_REGION?: string = 'us-east-1';

  // Email (Gmail SMTP)
  @IsString()
  @IsNotEmpty()
  EMAIL_HOST: string = 'smtp.gmail.com';

  @IsNumber()
  @Min(1)
  @Max(65535)
  EMAIL_PORT: number = 587;

  @IsString()
  @IsNotEmpty()
  EMAIL_USER: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_PASS: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;

  // Frontend URL
  @IsUrl({ require_tld: false, require_protocol: true })
  @IsNotEmpty()
  FRONTEND_URL: string = 'http://localhost:3001';

  // Webhook Secret (for webhook signature verification)
  @IsString()
  @IsNotEmpty()
  WEBHOOK_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    // Skip validation for optional properties (AWS S3 is optional - has local fallback)
    skipUndefinedProperties: true,
  });

  if (errors.length > 0) {
    // Format errors in a user-friendly way
    const errorMessages = errors.map((error) => {
      const property = error.property || 'unknown';
      const constraints = error.constraints || {};
      const messages = Object.values(constraints);
      return `  - ${property}: ${messages.join(', ')}`;
    });

    const errorMessage = `❌ Environment variable validation failed!\n\n` +
      `Missing or invalid environment variables:\n${errorMessages.join('\n')}\n\n` +
      `Please check your .env file or copy .env.example to .env and fill in the required values.\n` +
      `See backend/.env.example for all required environment variables.`;

    throw new Error(errorMessage);
  }

  return validatedConfig;
}


