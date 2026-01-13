import { Injectable, Logger } from '@nestjs/common';

/**
 * API Log Entry Interface
 * Stores sanitized API request/response data for verification
 */
export interface ApiLogEntry {
  timestamp: Date;
  endpoint: string;
  method: 'POST' | 'GET';
  requestBody?: any;
  responseStatus?: number;
  responseData?: any;
  error?: string;
  duration?: number; // milliseconds
}

/**
 * API Log Service
 * 
 * Tracks actual API calls to Mansa Transfers API for verification purposes.
 * This proves that the integration is real, not mocked.
 * 
 * In production, this could be stored in a database or Redis.
 * For now, we'll use in-memory storage (last 100 calls).
 */
@Injectable()
export class ApiLogService {
  private readonly logger = new Logger(ApiLogService.name);
  private readonly logs: ApiLogEntry[] = [];
  private readonly maxLogs = 100; // Keep last 100 API calls

  /**
   * Log an API call
   */
  logApiCall(entry: Omit<ApiLogEntry, 'timestamp'>): void {
    const logEntry: ApiLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Sanitize sensitive data
    this.sanitizeLogEntry(logEntry);

    // Add to logs
    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console for debugging
    this.logger.debug(`API Call: ${entry.method} ${entry.endpoint} - Status: ${entry.responseStatus || 'ERROR'}`);
  }

  /**
   * Get recent API logs
   */
  getRecentLogs(limit: number = 20): ApiLogEntry[] {
    return this.logs.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get all API logs
   */
  getAllLogs(): ApiLogEntry[] {
    return [...this.logs].reverse(); // Most recent first
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.length = 0;
    this.logger.log('API logs cleared');
  }

  /**
   * Sanitize sensitive data from log entries
   */
  private sanitizeLogEntry(entry: ApiLogEntry): void {
    // Sanitize request body
    if (entry.requestBody) {
      entry.requestBody = this.sanitizeObject(entry.requestBody);
    }

    // Sanitize response data
    if (entry.responseData) {
      entry.responseData = this.sanitizeObject(entry.responseData);
    }
  }

  /**
   * Recursively sanitize object to remove sensitive data
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sensitiveKeys = [
      'client-secret',
      'clientSecret',
      'secret',
      'password',
      'token',
      'authorization',
      'apiKey',
      'apiSecret',
    ];

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive information
      if (sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }
}


