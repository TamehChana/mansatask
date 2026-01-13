import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('config.redis.url') || 'redis://localhost:6379';
    
    // Parse Redis URL (format: redis://localhost:6379 or redis://:password@host:port)
    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connection established');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });
  }

  async onModuleInit() {
    try {
      // Test connection with timeout
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        ),
      ]);
      this.logger.log('Redis connection verified');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // In test or development mode, log warning but don't throw to allow app to start
      // Features requiring Redis will fail appropriately when they try to use it
      if (process.env.NODE_ENV === 'production') {
        throw error;
      } else {
        this.logger.warn('Redis connection failed. App will continue but Redis features will not work.');
      }
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Set a key-value pair with optional expiration (TTL in seconds)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiration on a key (TTL in seconds)
   */
  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }
}

