import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Throttler Module
 * Provides rate limiting functionality
 * Uses in-memory storage by default (can be upgraded to Redis for distributed systems)
 */
@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('config.nodeEnv') || 'development';
        
        return {
          // Default rate limit: 100 requests per minute
          throttlers: [
            {
              ttl: 60000, // 1 minute in milliseconds
              limit: nodeEnv === 'production' ? 100 : 1000, // Stricter in production
            },
          ],
          // Note: For distributed systems, configure Redis storage here
          // storage: new ThrottlerStorageService(redisService),
        };
      },
    }),
  ],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}

