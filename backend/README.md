# Payment Link Platform - Backend API

A production-grade NestJS backend API for processing mobile money payments through payment links. Built with security, scalability, and maintainability in mind.

## 🚀 Overview

This backend provides a RESTful API for merchants to create and manage payment links, process mobile money transactions, manage products, and generate receipts. The system integrates with the Mansa Transfers API for MTN Mobile Money payments and includes comprehensive features for transaction management, email notifications, and file storage.

## ✨ Features

- **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Password hashing with bcrypt
  - Password reset via email
  - Role-based access control (RBAC ready)

- **Payment Processing**
  - Payment link creation and management
  - Mobile money payment processing (MTN)
  - Webhook handling for payment status updates
  - Idempotency key support for duplicate payment prevention
  - Transaction history and filtering

- **Product Management**
  - CRUD operations for products
  - Image upload and storage (AWS S3 or local fallback)
  - Image proxy endpoint for secure delivery

- **Receipt Generation**
  - Automatic PDF receipt generation
  - QR code generation for receipts
  - Secure storage in AWS S3
  - Download endpoint for receipts

- **Email Notifications**
  - Payment success/failure notifications
  - Password reset emails
  - Customizable email templates using Handlebars

- **Dashboard & Analytics**
  - Real-time statistics
  - Revenue tracking
  - Transaction metrics
  - Payment link analytics

- **Security Features**
  - Input validation using class-validator
  - Rate limiting with @nestjs/throttler
  - Helmet for security headers
  - CORS configuration
  - Webhook signature verification
  - IDOR (Insecure Direct Object Reference) prevention

- **Developer Experience**
  - Swagger/OpenAPI documentation (development only)
  - Winston logging
  - Environment variable validation
  - Health check endpoint
  - Global exception handling

## 🛠 Tech Stack

- **Framework**: NestJS 11.x (TypeScript)
- **Database**: PostgreSQL 15 with Prisma ORM 6.x
- **Cache**: Redis 7 (via ioredis)
- **Authentication**: JWT (Passport.js), bcrypt
- **Validation**: class-validator, class-transformer
- **File Storage**: AWS S3 (with local fallback)
- **Email**: SendGrid Web API
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode
- **HTTP Client**: Axios
- **Logging**: Winston
- **Rate Limiting**: @nestjs/throttler
- **Security**: Helmet
- **API Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL 15 (or use Docker Compose)
- Redis 7 (or use Docker Compose)
- AWS account (optional, for S3 storage)
- SendGrid account (for email service)
- Mansa Transfers API credentials

## 🚦 Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/TamehChana/mansatask.git
cd mansatask/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Docker Services (Recommended)

Start PostgreSQL and Redis using Docker Compose from the project root:

```bash
# From project root
cd ..
docker-compose up -d postgres redis
```

Wait 10-15 seconds for services to start, then verify:

```bash
docker-compose ps
```

### Step 4: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Database (use Docker Compose DATABASE_URL or your own)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_link_db?schema=public

# Redis (use Docker Compose REDIS_URL or your own)
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate using: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here
JWT_REFRESH_EXPIRATION=7d

# Mansa Transfers API
MANSA_API_BASE_URL=https://api-stage.mansatransfers.com
MANSA_API_KEY=your-mansa-api-key
MANSA_API_SECRET=your-mansa-api-secret

# AWS S3 (Optional - falls back to local storage if not provided)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_S3_REGION=us-east-1

# Email (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=your-verified-email@example.com

# Webhook Secret (generate using: openssl rand -base64 32)
WEBHOOK_SECRET=your-webhook-secret-here
```

**Note**: For assessment purposes, test credentials for AWS S3 and SendGrid email are included in `.env.example`. Copy these values to your `.env` file for local testing.

### Step 5: Set Up Database

Generate Prisma client and run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database if seed script exists
# npm run seed
```

### Step 6: Start the Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

Swagger documentation will be available at `http://localhost:3000/api/docs` (development only)

## 📚 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive access/refresh tokens
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password using token

### Users (`/api/users`)

- `GET /api/users/profile` - Get current user profile (Protected)
- `PATCH /api/users/profile` - Update user profile (Protected)

### Products (`/api/products`)

- `GET /api/products` - Get all products for authenticated user (Protected)
- `POST /api/products` - Create a new product (Protected)
- `GET /api/products/:id` - Get product by ID (Protected)
- `PATCH /api/products/:id` - Update product (Protected)
- `DELETE /api/products/:id` - Delete product (Protected)
- `GET /api/products/image/*` - Proxy endpoint for product images (Public)

### Payment Links (`/api/payment-links`)

- `GET /api/payment-links` - Get all payment links for authenticated user (Protected)
- `POST /api/payment-links` - Create a new payment link (Protected)
- `GET /api/payment-links/:id` - Get payment link by ID (Protected)
- `PATCH /api/payment-links/:id` - Update payment link (Protected)
- `DELETE /api/payment-links/:id` - Delete payment link (Protected)
- `GET /api/payment-links/public/:slug` - Get public payment link details (Public)
- `GET /api/payment-links/:id/analytics` - Get payment link analytics (Protected)

### Payments (`/api/payments`)

- `POST /api/payments/initiate` - Initiate a payment (Public, requires idempotency key)
- `GET /api/payments/status/:externalReference` - Get payment status (Public)

### Transactions (`/api/transactions`)

- `GET /api/transactions` - Get all transactions for authenticated user (Protected)
- `GET /api/transactions/:id` - Get transaction by ID (Protected)
- `GET /api/transactions/:id/receipt` - Download receipt PDF (Protected)

### Receipts (`/api/receipts`)

- `GET /api/receipts/:externalReference` - Get receipt by external reference (Protected)
- `GET /api/receipts/:externalReference/download` - Download receipt PDF (Public)

### Dashboard (`/api/dashboard`)

- `GET /api/dashboard/stats` - Get dashboard statistics (Protected)

### Webhooks (`/api/webhooks`)

- `POST /api/webhooks/payment` - Handle payment webhook from Mansa Transfers (Public, signature verified)

### Health Check (`/api/health`)

- `GET /api/health` - Health check endpoint (Public)

## 🏗 Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── guards/        # JWT guards
│   │   └── strategies/    # Passport strategies
│   ├── users/             # User management module
│   ├── products/          # Product management module
│   ├── payment-links/     # Payment link management module
│   ├── payments/          # Payment processing module
│   │   └── services/      # Mansa Transfers service
│   ├── transactions/      # Transaction management module
│   ├── receipts/          # Receipt generation module
│   ├── dashboard/         # Dashboard analytics module
│   ├── webhooks/          # Webhook handling module
│   ├── email/             # Email service module
│   │   └── templates/     # Email templates (Handlebars)
│   ├── storage/           # File storage service (S3/local)
│   ├── redis/             # Redis cache service
│   ├── prisma/            # Prisma ORM service
│   ├── health/            # Health check module
│   ├── config/            # Configuration module
│   │   ├── configuration.ts
│   │   └── env.validation.ts
│   └── common/            # Shared utilities
│       ├── decorators/    # Custom decorators
│       ├── filters/       # Exception filters
│       ├── interceptors/  # Response interceptors
│       ├── middleware/    # Request middleware
│       ├── pipes/         # Validation pipes
│       └── services/      # Shared services (idempotency)
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── test/                  # E2E tests
├── .env.example           # Environment variables template
└── package.json
```

## 🧪 Testing

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Run Tests with Coverage

```bash
npm run test:cov
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## 🐳 Docker Support

The backend is containerized and can be run with Docker Compose. See the main project README for Docker setup instructions.

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## 🔒 Security Features

- **Input Validation**: All inputs are validated using class-validator DTOs
- **Authentication**: JWT-based authentication with secure token handling
  - **Dual Token Support**: Supports both Authorization header (Bearer tokens) and HttpOnly cookies
  - **Cookie-Based Auth**: Optional secure cookie-based authentication to prevent XSS token theft
  - **Backwards Compatible**: Existing header-based authentication continues to work
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Protects against brute force and DDoS attacks
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers for HTTP protection
- **Webhook Verification**: HMAC signature verification for webhooks
- **Idempotency**: Prevents duplicate payments using Redis
- **IDOR Prevention**: User-scoped resource access

## 📝 Environment Variables

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT access tokens
- `JWT_REFRESH_SECRET` - Secret for JWT refresh tokens
- `MANSA_API_KEY` - Mansa Transfers API key
- `MANSA_API_SECRET` - Mansa Transfers API secret
- `EMAIL_USER` - SendGrid email user (usually "apikey")
- `EMAIL_PASS` - SendGrid API key
- `WEBHOOK_SECRET` - Secret for webhook signature verification

### Optional Variables

- `AWS_ACCESS_KEY_ID` - AWS access key (for S3 storage)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (for S3 storage)
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `AWS_S3_REGION` - S3 region (default: us-east-1)
- `EMAIL_FROM` - Custom "from" email address

See `.env.example` for complete configuration options.

## 🍪 Cookie-Based Authentication (Enhanced Security)

The backend supports **optional cookie-based JWT authentication** for enhanced security. This feature provides protection against XSS attacks by storing tokens in HttpOnly cookies that cannot be accessed by JavaScript.

### How It Works

- **Backwards Compatible**: The backend accepts tokens via both:
  - `Authorization: Bearer <token>` header (existing method, still works)
  - HttpOnly cookies named `accessToken` and `refreshToken` (new secure method)

- **Automatic Cookie Setting**: When users register, login, or refresh tokens, the backend automatically sets secure HttpOnly cookies in addition to returning JSON responses.

- **Cookie Configuration**:
  - `httpOnly: true` - Prevents JavaScript access (XSS protection)
  - `secure: true` - Only sent over HTTPS in production
  - `sameSite: 'strict'` - CSRF protection in production
  - Appropriate expiration times matching token lifetimes

### Enabling Cookie-Based Auth on Frontend

To use cookie-based authentication on the frontend, set the following environment variable:

```env
NEXT_PUBLIC_AUTH_USE_COOKIES=true
```

When enabled, the frontend will:
- Stop storing tokens in localStorage
- Rely on HttpOnly cookies for authentication
- Automatically send cookies with all requests (via `withCredentials: true`)

**Note**: Cookie-based auth is **opt-in**. By default, the system uses the existing header-based authentication (localStorage + Authorization header) to maintain backwards compatibility.

## 🚀 Deployment

The backend is deployed on **Render**. For deployment instructions, see the main project README.

### Environment Setup for Production

1. Set all required environment variables in your hosting platform
2. Ensure database and Redis connections are configured
3. Run database migrations: `npx prisma migrate deploy`
4. Build the application: `npm run build`
5. Start the server: `npm run start:prod`

## 📖 API Documentation

Swagger/OpenAPI documentation is available at `/api/docs` when running in development mode. The documentation includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses

## 🐛 Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Check database exists and user has proper permissions

### Redis Connection Issues

- Ensure Redis is running
- Verify `REDIS_URL` is correct
- Check Redis is accessible from your network

### Image Upload Issues

- Verify AWS credentials are correct (if using S3)
- Check S3 bucket exists and has proper permissions
- Ensure `uploads/` directory exists (if using local storage)

### Email Sending Issues

- Verify SendGrid API key is correct
- Check email templates exist in `src/email/templates/`
- Ensure `EMAIL_FROM` address is verified in SendGrid

## 📄 License

This project is private and proprietary.

## 👥 Support

For issues and questions, please refer to the main project README or contact the project maintainer.
