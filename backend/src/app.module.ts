import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ThrottlerModule } from './common/throttler/throttler.module';
import { HealthModule } from './health/health.module';
import { winstonConfig } from './common/logger/winston.config';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { PaymentLinksModule } from './payment-links/payment-links.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { EmailModule } from './email/email.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StorageModule } from './storage/storage.module';
import configuration from './config/configuration';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    // Winston Logger Module (Structured Logging)
    WinstonModule.forRoot(winstonConfig()),
    // Prisma Module (Global)
    PrismaModule,
    // Redis Module (Global)
    RedisModule,
    // Throttler Module (Rate Limiting)
    ThrottlerModule,
    // Auth Module
    AuthModule,
    // Users Module
    UsersModule,
    // Products Module
    ProductsModule,
    // Payment Links Module
    PaymentLinksModule,
    // Payments Module
    PaymentsModule,
    // Webhooks Module
    WebhooksModule,
    // Transactions Module
    TransactionsModule,
    // Receipts Module
    ReceiptsModule,
    // Email Module
    EmailModule,
    // Dashboard Module
    DashboardModule,
    // Storage Module (S3/Local)
    StorageModule,
    // Health Module
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard (applied to all routes by default)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global logging interceptor (logs method execution time)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logging middleware to all routes
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
