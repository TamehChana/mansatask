# Payment Link Platform

A production-grade fintech application that enables merchants to create and share payment links for collecting mobile money payments from customers. The platform provides a complete payment processing solution with transaction management, receipt generation, and comprehensive reporting.

## Project Overview

The Payment Link Platform is a full-stack web application designed for businesses to streamline their payment collection process through mobile money services. Merchants can create products, generate unique payment links, and share them with customers who can complete payments directly through their mobile money accounts.

### Key Features

- **User Authentication & Management**: Secure user registration, login, password reset, and profile management with JWT-based authentication
- **Product Management**: Create, read, update, and delete reusable products with image support
- **Payment Link Generation**: Generate unique, shareable payment links with optional expiration dates and usage limits
- **Mobile Money Payments**: Process payments through MTN mobile money service (single provider support)
- **Public Payment Pages**: Customer-facing payment pages that display product information, merchant details, and payment forms
- **Transaction Management**: Comprehensive transaction history with filtering and detailed views
- **Receipt Generation**: Automatic PDF receipt generation with QR codes, stored in AWS S3
- **Email Notifications**: Automated email notifications for payment events and password resets using SendGrid
- **Dashboard & Analytics**: Real-time statistics including total revenue, transaction counts, and payment link metrics
- **QR Code Support**: Generate QR codes for payment links and receipts

## Tech Stack

### Backend

- **Framework**: NestJS 11.x (TypeScript)
- **Database**: PostgreSQL 15
- **ORM**: Prisma 6.x
- **Cache**: Redis 7
- **Authentication**: JWT (Passport.js), bcrypt for password hashing
- **Validation**: class-validator, class-transformer
- **PDF Generation**: PDFKit
- **Email**: SendGrid Web API
- **File Storage**: AWS S3
- **QR Codes**: qrcode
- **API Client**: Axios
- **Logging**: Winston
- **Rate Limiting**: @nestjs/throttler

### Frontend

- **Framework**: Next.js 16.x (App Router)
- **UI Library**: React 19.x
- **Language**: TypeScript 5.x
- **State Management**: 
  - React Query (server state management)
  - Zustand (client state management)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **QR Codes**: qrcode.react
- **Styling**: Tailwind CSS 4.x

### Infrastructure

- **Database**: PostgreSQL (deployed on Render)
- **Cache**: Redis (deployed on Render)
- **File Storage**: AWS S3
- **Email Service**: SendGrid
- **Payment Provider**: Mansa Transfers API
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Containerization**: Docker and Docker Compose

### Development Tools

- **Testing**: Jest, Supertest, React Testing Library
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git
- **Package Manager**: npm

## How to Run the Project Locally

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Docker and Docker Compose (recommended for local development)
- PostgreSQL 15 (if not using Docker)
- Redis 7 (if not using Docker)
- AWS account (for S3 storage - optional, falls back to local storage)
- SendGrid account (for email service)
- Mansa Transfers API credentials (contact project owner for test credentials)

### Step 1: Clone the Repository

```bash
git clone https://github.com/TamehChana/mansatask.git
cd mansatask
```

### Step 2: Set Up Docker Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d postgres redis
```

Wait 10-15 seconds for services to start, then verify:

```bash
docker-compose ps
```

You should see both services running and healthy.

### Step 3: Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

4. Update the `.env` file with your actual credentials:

**Note**: Copy the `.env.example` file to `.env` and replace the placeholder values with your actual credentials. The `.env.example` file contains the template with all required environment variables.

For interviewers/assessors: Contact the project owner to obtain:
- Mansa Transfers API credentials (API key and secret)
- SendGrid API key and verified sender email
- AWS credentials (optional, if S3 storage is needed)
- Or use test/demo credentials if provided

Required variables to configure:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/payment_link_db?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRATION=7d

# Mansa Transfers API
MANSA_API_BASE_URL=https://api-stage.mansatransfers.com
MANSA_API_KEY=your-mansa-api-key
MANSA_API_SECRET=your-mansa-api-secret

# Email (SendGrid)
EMAIL_USER=your-sendgrid-sender-email
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=your-sendgrid-sender-email

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Webhook Secret
WEBHOOK_SECRET=your-webhook-secret

# AWS S3 (Optional - falls back to local storage if not provided)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_S3_REGION=us-east-1
```

5. Run database migrations:

```bash
npx prisma migrate dev
```

6. Generate Prisma Client:

```bash
npx prisma generate
```

7. Start the backend server:

```bash
npm run start:dev
```

The backend will run on `http://localhost:3000`

### Step 4: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

4. Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3001`

### Step 5: Access the Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- API Documentation (Swagger): http://localhost:3000/api/docs (development mode only)
- Health Check: http://localhost:3000/api/health

### Running Tests

**Backend Tests:**

```bash
cd backend
npm run test              # Run unit tests
npm run test:e2e          # Run end-to-end tests
npm run test:cov          # Run tests with coverage
```

**Frontend Tests:**

```bash
cd frontend
npm run test              # Run tests
npm run test:coverage     # Run tests with coverage
```

### Docker Development

To run the entire application using Docker:

```bash
docker-compose up
```

This will start PostgreSQL, Redis, backend, and frontend services.

## Assumptions Made

The following assumptions were made during the development of this platform:

1. **Payment Provider**: The platform uses Mansa Transfers API as the payment provider for mobile money transactions. Only MTN mobile money is currently supported in the public payment interface.

2. **Currency**: All transactions are processed in CFA (West African CFA Franc). The platform does not support multi-currency transactions.

3. **Email Service**: SendGrid Web API is used for sending transactional emails. The platform assumes SendGrid API key authentication.

4. **Storage**: Receipt PDFs are stored in AWS S3. The platform falls back to local storage if AWS S3 credentials are not provided, but this is not recommended for production.

5. **Authentication**: JWT-based authentication with access tokens (15-minute expiration) and refresh tokens (7-day expiration) is used for all authenticated endpoints.

6. **User Roles**: All users are merchants by default. Administrative roles exist in the schema but are not currently implemented in the application logic.

7. **Payment Link Expiration**: Payment links can optionally have expiration dates or maximum usage limits. By default, payment links do not expire and have no usage limits.

8. **Idempotency**: All payment initiation requests require an idempotency key to prevent duplicate transactions. Idempotency keys are stored in Redis with appropriate TTL.

9. **Webhook Processing**: Payment status updates are received via webhooks from the payment provider. Webhook signatures are verified for security.

10. **Transaction States**: Transactions move through the following states: PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED. Once a transaction reaches SUCCESS or FAILED state, it is considered final.

11. **Receipt Generation**: Receipts are automatically generated when a payment transaction reaches SUCCESS status. Receipts are immutable once generated.

12. **Product Quantity**: Products can have quantity tracking. A quantity of 0 typically indicates out of stock, while null or very high values indicate unlimited stock.

13. **Payment Link Ownership**: Users can only access and manage payment links they created. All endpoints enforce user ownership through authorization guards.

14. **Rate Limiting**: All API endpoints have rate limiting enabled to prevent abuse. Production environments have stricter limits than development.

15. **CORS**: The backend allows requests from the configured frontend URL. Vercel preview URLs are also supported for development and staging environments.

## Limitations & Possible Improvements

### Current Limitations

1. **Single Payment Provider**: The platform currently supports only MTN mobile money in the public payment interface, despite the backend supporting multiple providers. The codebase includes support for Vodafone and AirtelTigo, but these are not exposed in the user interface.

2. **Single Currency**: The platform only supports CFA (West African CFA Franc). Multi-currency support would require significant changes to the data model and business logic.

3. **Email Delivery**: While SendGrid is used for email delivery, emails sent from Gmail addresses through SendGrid may experience minor delays due to Gmail's DMARC policy. This is expected behavior and emails are still delivered successfully.

4. **Testing Coverage**: While the application has test suites, coverage could be expanded to include more edge cases and integration scenarios.

5. **Admin Functionality**: The database schema includes admin roles, but administrative features are not currently implemented in the application.

6. **Error Tracking**: The application uses structured logging with Winston, but does not integrate with external error tracking services like Sentry for production monitoring.

7. **Performance Monitoring**: While the application includes health checks and logging, it does not have comprehensive performance monitoring or APM tools integrated.

8. **API Documentation**: Interactive Swagger/OpenAPI documentation is available in development mode at `/api/docs`, but is not exposed in production for security reasons.

9. **Multi-tenancy**: The current architecture is single-tenant. Each user manages their own data, but there is no organizational or team-based structure.

10. **Receipt Customization**: Receipts follow a standard format. Custom branding or template customization for receipts is not currently supported.

### Possible Improvements

1. **Multi-Currency Support**: Implement support for multiple currencies with proper conversion handling and display formatting.

2. **Multiple Payment Providers**: Expand the public interface to support all mobile money providers (Vodafone, AirtelTigo) and potentially add other payment methods.

3. **Admin Dashboard**: Implement administrative features for platform management, user management, and system-wide analytics.

4. **Enhanced Testing**: Expand test coverage to include more integration tests, end-to-end tests, and performance tests.

5. **Error Tracking Integration**: Integrate services like Sentry for production error tracking and monitoring.

6. **Performance Monitoring**: Add APM tools like New Relic or Datadog for comprehensive performance monitoring.

7. **API Documentation**: Expose Swagger/OpenAPI documentation in production (currently only available in development mode).

8. **Receipt Templates**: Allow merchants to customize receipt templates with their branding and additional fields.

9. **Webhook Retry Logic**: Implement more sophisticated webhook retry mechanisms with exponential backoff and dead-letter queues.

10. **Caching Strategy**: Implement more comprehensive caching strategies for frequently accessed data to improve performance.

11. **Background Job Processing**: Implement a more robust background job processing system for email sending and other asynchronous tasks.

12. **Multi-tenancy Support**: Add organizational/team structure to support multiple users working under the same merchant account.

13. **Analytics & Reporting**: Add more comprehensive analytics and reporting features with export capabilities.

14. **Mobile Application**: Develop native mobile applications for iOS and Android to complement the web platform.

15. **Internationalization**: Add support for multiple languages to serve a broader customer base.

16. **Payment Link Analytics**: Provide detailed analytics for individual payment links including conversion rates, geographic data, and time-based patterns.

17. **Bulk Operations**: Add support for bulk operations like bulk payment link creation or bulk product updates.

18. **Webhook Management UI**: Provide a user interface for managing webhook endpoints and viewing webhook delivery status.

19. **Automated Refunds**: Implement automated refund functionality with proper approval workflows.

20. **Subscription Management**: Add support for recurring payments and subscription management if needed for future use cases.

## Project Structure

```
mansatask/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management module
│   │   ├── products/       # Product management module
│   │   ├── payment-links/  # Payment link module
│   │   ├── payments/       # Payment processing module
│   │   ├── transactions/   # Transaction management module
│   │   ├── receipts/       # Receipt generation module
│   │   ├── webhooks/       # Webhook handling module
│   │   ├── dashboard/      # Dashboard statistics module
│   │   ├── email/          # Email service module
│   │   ├── config/         # Configuration module
│   │   └── main.ts         # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Database migrations
│   └── package.json
│
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript type definitions
│   │   └── lib/            # Utility libraries
│   └── package.json
│
├── docker-compose.yml       # Docker Compose configuration
├── render.yaml              # Render deployment configuration
├── vercel.json              # Vercel deployment configuration
└── README.md                # This file
```

## API Documentation

Interactive API documentation is available when running the application in development mode. Once the backend server is running, visit:

- **Swagger UI**: http://localhost:3000/api/docs

The Swagger documentation provides:
- Complete API endpoint reference
- Request/response schemas
- Interactive API testing interface
- Authentication token support
- Request examples

Note: API documentation is only available in development and staging environments for security reasons. In production, API documentation is disabled.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Products
- `GET /api/products` - List user's products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/upload-image` - Upload product image

### Payment Links
- `GET /api/payment-links` - List user's payment links
- `POST /api/payment-links` - Create payment link
- `GET /api/payment-links/:id` - Get payment link details
- `PATCH /api/payment-links/:id` - Update payment link
- `DELETE /api/payment-links/:id` - Delete payment link
- `GET /api/payment-links/public/:slug` - Get public payment link (no auth)

### Payments
- `POST /api/payments/initiate` - Initiate payment (public, requires idempotency key)
- `GET /api/payments/status/:externalReference` - Get payment status (public)
- `GET /api/payments/:id` - Get payment details

### Transactions
- `GET /api/transactions` - List user's transactions
- `GET /api/transactions/:id` - Get transaction details

### Receipts
- `GET /api/receipts/:transactionId` - Get receipt information
- `GET /api/receipts/:transactionId/download` - Download receipt PDF
- `GET /api/receipts/public/:externalReference/download` - Download receipt PDF (public)

### Webhooks
- `POST /api/webhooks/payment` - Payment webhook endpoint (public, signature verification required)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Health
- `GET /api/health` - Health check endpoint

## Environment Variables

### Backend Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT access tokens
- `JWT_REFRESH_SECRET` - Secret key for JWT refresh tokens
- `MANSA_API_KEY` - Mansa Transfers API key
- `MANSA_API_SECRET` - Mansa Transfers API secret
- `EMAIL_USER` - SendGrid sender email
- `EMAIL_PASS` - SendGrid API key
- `FRONTEND_URL` - Frontend application URL
- `WEBHOOK_SECRET` - Secret for webhook signature verification

Optional:
- `NODE_ENV` - Environment (development, production, test)
- `PORT` - Server port (default: 3000)
- `JWT_EXPIRATION` - Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRATION` - Refresh token expiration (default: 7d)
- `AWS_ACCESS_KEY_ID` - AWS access key for S3
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for S3
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `AWS_S3_REGION` - S3 region (default: us-east-1)
- `EMAIL_FROM` - Email sender address (defaults to EMAIL_USER)

### Frontend Environment Variables

Required:
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `http://localhost:3000/api`)

## Security Considerations

- All passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens are used for authentication with short-lived access tokens and long-lived refresh tokens
- All API endpoints are protected with authentication guards except public endpoints
- User data access is restricted through authorization checks (IDOR prevention)
- Rate limiting is enabled on all endpoints
- Input validation is performed using DTOs with class-validator (backend) and Zod (frontend)
- Idempotency keys are required for payment endpoints to prevent duplicate transactions
- Webhook signatures are verified to ensure authenticity
- CORS is configured to only allow requests from authorized origins
- Security headers are implemented using Helmet
- Sensitive data is never exposed in error responses

## Deployment

The application is deployed using the following platforms:

- **Frontend**: Vercel (https://mansatask-ix59.vercel.app)
- **Backend**: Render (https://payment-link-backend.onrender.com)
- **Database**: PostgreSQL on Render
- **Cache**: Redis on Render
- **File Storage**: AWS S3

Deployment configurations:
- `render.yaml` - Render deployment blueprint
- `vercel.json` - Vercel deployment configuration

For detailed deployment instructions, refer to the deployment configuration files.

## Documentation

For comprehensive technical documentation, including detailed API specifications, architecture details, database schema, and system workflows, see [DOCUMENTATION.md](./DOCUMENTATION.md).

## License

This project is proprietary and confidential. All rights reserved.

## Contact

For questions or support, please contact the development team.
