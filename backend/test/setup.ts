// Set up test environment variables before tests run
process.env.NODE_ENV = 'test';
// Use test database URL that matches docker-compose setup
// Default to docker-compose postgres: postgres:postgres@localhost:5433/payment_link_db
// Or use TEST_DATABASE_URL if provided, or fallback to DATABASE_URL
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/payment_link_db?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-testing-only';
process.env.JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
process.env.MANSA_API_BASE_URL = process.env.MANSA_API_BASE_URL || 'https://api-stage.mansatransfers.com';
process.env.MANSA_API_KEY = process.env.MANSA_API_KEY || 'test-api-key';
process.env.MANSA_API_SECRET = process.env.MANSA_API_SECRET || 'test-api-secret';
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test-secret-key';
process.env.AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'test-bucket';
process.env.AWS_S3_REGION = process.env.AWS_S3_REGION || 'us-east-1';
process.env.EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
process.env.EMAIL_PORT = process.env.EMAIL_PORT || '587';
process.env.EMAIL_USER = process.env.EMAIL_USER || 'test@example.com';
process.env.EMAIL_PASS = process.env.EMAIL_PASS || 'test-password';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'test@example.com';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
process.env.WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-webhook-secret';

