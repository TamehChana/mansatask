import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

/**
 * Winston Logger Configuration
 * Provides structured logging with file rotation and console output
 */
export const winstonConfig = (): WinstonModuleOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const logDir = path.join(process.cwd(), 'logs');

  // Log levels: error, warn, info, debug, verbose
  const logLevel = nodeEnv === 'production' ? 'info' : 'debug';

  return {
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    defaultMeta: {
      service: 'payment-link-platform',
      environment: nodeEnv,
    },
    transports: [
      // Console transport (always enabled)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}]` : '';
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
          }),
        ),
      }),
      // Error log file (errors only)
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      // Combined log file (all levels)
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      // Payment transaction log (separate file for payment events)
      new winston.transports.File({
        filename: path.join(logDir, 'payments.log'),
        level: 'info',
        maxsize: 10485760, // 10MB (payments generate more logs)
        maxFiles: 10,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
    // Handle exceptions and rejections
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'exceptions.log'),
      }),
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(logDir, 'rejections.log'),
      }),
    ],
  };
};

