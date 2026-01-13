import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request/Response Logging Middleware
 * Logs all HTTP requests with method, URL, status, and duration
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();
    const userAgent = req.get('user-agent') || '';

    // Log request
    this.logger.log(
      `${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    // Capture response
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const contentLength = res.get('content-length') || 0;

      // Log response
      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
      const logMessage = `${method} ${originalUrl} ${statusCode} ${duration}ms - ${contentLength}bytes`;

      if (logLevel === 'error') {
        this.logger.error(logMessage, {
          method,
          url: originalUrl,
          statusCode,
          duration,
          ip,
          userAgent,
        });
      } else if (logLevel === 'warn') {
        this.logger.warn(logMessage, {
          method,
          url: originalUrl,
          statusCode,
          duration,
          ip,
          userAgent,
        });
      } else {
        this.logger.log(logMessage, {
          method,
          url: originalUrl,
          statusCode,
          duration,
          ip,
          userAgent,
        });
      }

      // Log slow requests (over 1 second)
      if (duration > 1000) {
        this.logger.warn(`Slow request detected: ${method} ${originalUrl} took ${duration}ms`, {
          method,
          url: originalUrl,
          duration,
          statusCode,
        });
      }
    });

    next();
  }
}

