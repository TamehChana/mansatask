import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logging Interceptor
 * Logs method execution time and results
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.debug(
            `${className}.${handlerName} executed in ${duration}ms`,
            {
              method,
              url,
              handler: `${className}.${handlerName}`,
              duration,
            },
          );

          // Log slow operations (over 500ms)
          if (duration > 500) {
            this.logger.warn(
              `Slow operation detected: ${className}.${handlerName} took ${duration}ms`,
              {
                method,
                url,
                handler: `${className}.${handlerName}`,
                duration,
              },
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `${className}.${handlerName} failed after ${duration}ms: ${error.message}`,
            {
              method,
              url,
              handler: `${className}.${handlerName}`,
              duration,
              error: error.message,
              stack: error.stack,
            },
          );
        },
      }),
    );
  }
}


