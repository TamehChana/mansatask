import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from '../../redis/redis.service';

/**
 * Redis-based throttler storage
 * Stores rate limit data in Redis for distributed rate limiting
 * 
 * Note: This is a custom implementation for future use.
 * Currently, the throttler uses in-memory storage by default.
 * To use Redis storage, uncomment the storage configuration in throttler.module.ts
 */
@Injectable()
export class ThrottlerStorageService implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Get storage key for a given key
   */
  private getStorageKey(key: string, throttlerName: string): string {
    return `throttler:${throttlerName}:${key}`;
  }

  /**
   * Increment request count for a key
   * This is the main method required by ThrottlerStorage interface
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const storageKey = this.getStorageKey(key, throttlerName);
    const value = await this.redisService.get(storageKey);
    
    let record: ThrottlerStorageRecord;
    
    if (!value) {
      // First request for this key
      record = {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } else {
      try {
        const parsed = JSON.parse(value);
        const now = Date.now();
        
        // Check if blocked
        if (parsed.timeToBlockExpire && parsed.timeToBlockExpire > now) {
          return {
            totalHits: parsed.totalHits || 0,
            timeToExpire: parsed.timeToBlockExpire - now,
            isBlocked: true,
            timeToBlockExpire: parsed.timeToBlockExpire,
          };
        }
        
        // Check if limit exceeded
        const totalHits = (parsed.totalHits || 0) + 1;
        const isBlocked = totalHits > limit;
        const timeToBlockExpire = isBlocked ? now + blockDuration : 0;
        
        record = {
          totalHits,
          timeToExpire: ttl,
          isBlocked,
          timeToBlockExpire,
        };
      } catch {
        // Invalid data, start fresh
        record = {
          totalHits: 1,
          timeToExpire: ttl,
          isBlocked: false,
          timeToBlockExpire: 0,
        };
      }
    }
    
    // Store in Redis
    const ttlSeconds = Math.ceil((record.isBlocked ? record.timeToBlockExpire - Date.now() : ttl) / 1000);
    await this.redisService.set(
      storageKey,
      JSON.stringify(record),
      ttlSeconds,
    );
    
    return record;
  }
}

