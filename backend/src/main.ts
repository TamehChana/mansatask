import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    // Validate environment variables before starting the app
    // This will throw a clear error if required variables are missing
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true, // Buffer logs until Winston is ready
    });
    const configService = app.get(ConfigService);
    
    // Use Winston logger instead of default NestJS logger
    const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(logger);

  // Security: Helmet - Set security HTTP headers
  const nodeEnv = configService.get<string>('config.nodeEnv') || 'development';
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: nodeEnv === 'production',
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // Allow API endpoints to be accessed
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );

  // Security: Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Serve static files (receipt PDFs and product images) - for local storage fallback
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // CORS configuration
  const frontendUrl = configService.get<string>('config.frontendUrl');
  // Normalize frontend URL - remove trailing slash to match browser origin format
  const normalizedFrontendUrl = frontendUrl?.replace(/\/$/, '');
  
  // In development, allow all origins for easier debugging
  // In production, allow the configured frontend URL and Vercel preview URLs
  if (nodeEnv === 'development') {
    app.enableCors({
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  } else {
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }
        
        // Normalize both URLs by removing trailing slash
        const normalizedOrigin = origin.replace(/\/$/, '');
        const allowedOrigin = normalizedFrontendUrl?.replace(/\/$/, '') || '';
        
        // Check if origin matches the production URL
        if (normalizedOrigin === allowedOrigin) {
          callback(null, true);
        } 
        // Allow Vercel preview URLs (they use patterns like: project-name-*.vercel.app)
        else if (normalizedOrigin.includes('.vercel.app') && normalizedOrigin.includes('mansatask')) {
          callback(null, true);
        } else {
          // Log for debugging (in production, this is expected for unauthorized origins)
          logger.warn(`CORS: Origin ${origin} not allowed. Expected: ${allowedOrigin} or Vercel preview URL`);
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Note: Global rate limiting is configured in ThrottlerModule
  // Individual controllers can use @Throttle() decorator for custom limits

  // Request logging is handled by LoggingMiddleware in AppModule

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = configService.get<number>('config.port') || 3000;

  // Swagger/OpenAPI Documentation (only in development and staging)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Payment Link Platform API')
      .setDescription(
        'Production-grade fintech API for creating and managing payment links. ' +
        'Supports mobile money payments through MTN, Vodafone, and AirtelTigo.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('products', 'Product management endpoints')
      .addTag('payment-links', 'Payment link management endpoints')
      .addTag('payments', 'Payment processing endpoints')
      .addTag('transactions', 'Transaction management endpoints')
      .addTag('webhooks', 'Webhook endpoints')
      .addTag('receipts', 'Receipt generation endpoints')
      .addTag('dashboard', 'Dashboard and analytics endpoints')
      .addTag('health', 'Health check endpoints')
      .addServer('http://localhost:3000/api', 'Development server')
      .addServer('https://api.yourdomain.com/api', 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
  }
    // Explicitly listen on all interfaces (0.0.0.0) to accept connections from network
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
    logger.log(`🌐 Network access: http://0.0.0.0:${port}/api`);
    logger.log(`🔒 Security: Helmet enabled, Rate limiting enabled`);
    logger.log(`📊 Monitoring: Structured logging enabled, Health checks enabled`);
    logger.log(`📈 Rate Limits: ${nodeEnv === 'production' ? 'Strict (production)' : 'Relaxed (development)'}`);
        } catch (error) {
          console.error('❌ Failed to start application:');
          if (error instanceof Error) {
            // If it's an environment variable validation error, show a helpful message
            if (error.message.includes('Environment variable validation failed')) {
              console.error('\n' + error.message);
              console.error('\n💡 Quick fix:');
              console.error('  1. Copy backend/.env.example to backend/.env');
              console.error('  2. Fill in all required values in backend/.env');
              console.error('  3. Restart the application\n');
            } else {
              console.error('Error message:', error.message);
              if (error.stack) {
                console.error('Stack trace:', error.stack);
              }
            }
          } else {
            console.error(error);
          }
          process.exit(1);
        }
}
bootstrap();
