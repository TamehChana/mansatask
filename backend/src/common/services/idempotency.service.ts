import { Injectable, ConflictException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class IdempotencyService {
  private readonly IDEMPOTENCY_PREFIX = 'idempotency:';
  private readonly IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours in seconds

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generate Redis key for idempotency
   */
  private getKey(idempotencyKey: string): string {
    return `${this.IDEMPOTENCY_PREFIX}${idempotencyKey}`;
  }

  /**
   * Check if idempotency key exists and return stored response
   * If key doesn't exist, return null
   */
  async getStoredResponse(idempotencyKey: string): Promise<any | null> {
    const key = this.getKey(idempotencyKey);
    const storedValue = await this.redisService.get(key);

    if (!storedValue) {
      return null;
    }

    try {
      return JSON.parse(storedValue);
    } catch (error) {
      // If stored value is not valid JSON, treat as if key doesn't exist
      return null;
    }
  }

  /**
   * Store response for idempotency key
   * Returns true if stored successfully, false if key already exists (should not happen if called correctly)
   */
  async storeResponse(
    idempotencyKey: string,
    response: any,
    ttl?: number,
  ): Promise<boolean> {
    const key = this.getKey(idempotencyKey);

    // Check if key already exists
    const exists = await this.redisService.exists(key);
    if (exists) {
      // Key already exists - this should not happen if called correctly
      // but we'll return false to indicate conflict
      return false;
    }

    // Store response as JSON string
    const value = JSON.stringify(response);
    const expirationTime = ttl || this.IDEMPOTENCY_TTL;

    await this.redisService.set(key, value, expirationTime);
    return true;
  }

  /**
   * Process idempotent request
   * - If key exists, return stored response
   * - If key doesn't exist, store the response and return it
   * 
   * This method ensures idempotency: same request returns same response
   */
  async processRequest<T>(
    idempotencyKey: string,
    requestHandler: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Check if response already exists
    const storedResponse = await this.getStoredResponse(idempotencyKey);
    if (storedResponse !== null) {
      // Return stored response (idempotent behavior)
      return storedResponse as T;
    }

    // Execute request handler
    const response = await requestHandler();

    // Store response for future idempotent requests
    await this.storeResponse(idempotencyKey, response, ttl);

    return response;
  }

  /**
   * Validate and get stored response or throw conflict
   * Used for payment endpoints where idempotency is required
   */
  async validateOrThrow(idempotencyKey: string): Promise<any> {
    const storedResponse = await this.getStoredResponse(idempotencyKey);
    
    if (storedResponse !== null) {
      // Key exists - this is a duplicate request
      // Return stored response instead of throwing error (idempotent behavior)
      return storedResponse;
    }

    // Key doesn't exist - request can proceed
    return null;
  }
}




