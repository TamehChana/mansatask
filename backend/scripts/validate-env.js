#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are set
 * before starting the application. Run this before deployment or startup.
 * 
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

// Required environment variables (from env.validation.ts)
const requiredVars = {
  // Application
  NODE_ENV: 'development',
  PORT: '3000',
  
  // Database
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/payment_link_db?schema=public',
  
  // Redis
  REDIS_URL: 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRATION: '15m',
  JWT_REFRESH_SECRET: 'your-super-secret-refresh-key-change-this-in-production',
  JWT_REFRESH_EXPIRATION: '7d',
  
  // Mansa Transfers API
  MANSA_API_BASE_URL: 'https://api-stage.mansatransfers.com',
  MANSA_API_KEY: 'your-mansa-api-key',
  MANSA_API_SECRET: 'your-mansa-api-secret',
  
  // AWS S3
  AWS_ACCESS_KEY_ID: 'your-aws-access-key-id',
  AWS_SECRET_ACCESS_KEY: 'your-aws-secret-access-key',
  AWS_S3_BUCKET_NAME: 'your-s3-bucket-name',
  AWS_S3_REGION: 'us-east-1',
  
  // Email
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: '587',
  EMAIL_USER: 'your-email@gmail.com',
  EMAIL_PASS: 'your-app-password',
  
  // Frontend
  FRONTEND_URL: 'http://localhost:3001',
  
  // Webhook
  WEBHOOK_SECRET: 'your-webhook-secret-change-this-in-production',
};

// Variables that should NOT have example/default values in production
const productionRequiredVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MANSA_API_KEY',
  'MANSA_API_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'EMAIL_USER',
  'EMAIL_PASS',
  'WEBHOOK_SECRET',
];

function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  
  console.log(`🔍 Validating environment variables (NODE_ENV: ${nodeEnv})...\n`);
  
  const missing = [];
  const invalid = [];
  
  // Check all required variables
  for (const [varName, defaultValue] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missing.push(varName);
      continue;
    }
    
    // In production, check that sensitive variables don't have default/example values
    if (isProduction && productionRequiredVars.includes(varName)) {
      if (value === defaultValue || value.includes('your-') || value.includes('change-this')) {
        invalid.push({
          name: varName,
          reason: `has example/default value. Must be set to a real value in production.`,
        });
      }
    }
  }
  
  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('');
  }
  
  if (invalid.length > 0) {
    console.error('❌ Invalid environment variables (using example/default values):');
    invalid.forEach(({ name, reason }) => {
      console.error(`   - ${name}: ${reason}`);
    });
    console.error('');
  }
  
  if (missing.length === 0 && invalid.length === 0) {
    console.log('✅ All required environment variables are set!\n');
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      console.warn('⚠️  Warning: .env file not found.');
      console.warn('   Consider copying .env.example to .env and filling in the values.\n');
    }
    
    return true;
  } else {
    console.error('💡 Quick fix:');
    console.error('  1. Copy backend/.env.example to backend/.env');
    console.error('  2. Fill in all required values in backend/.env');
    console.error('  3. For production, ensure all secrets are set to real values (not examples)\n');
    return false;
  }
}

// Run validation
if (require.main === module) {
  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnvironment };


