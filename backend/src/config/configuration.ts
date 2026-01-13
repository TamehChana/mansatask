import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Mansa Transfers API
  mansaTransfers: {
    baseUrl: process.env.MANSA_API_BASE_URL || 'https://api-stage.mansatransfers.com',
    apiKey: process.env.MANSA_API_KEY,
    apiSecret: process.env.MANSA_API_SECRET,
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
    s3Region: process.env.AWS_S3_REGION || 'us-east-1',
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },

  // Webhook
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
  },
}));


