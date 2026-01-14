# Payment Link Platform

## 📋 Project Overview

Payment Link Platform is a production-grade fintech application that enables merchants to create and share payment links for collecting mobile money payments from customers. The platform supports multiple mobile money providers (MTN, Vodafone, AirtelTigo) and provides a complete payment processing solution with transaction management, receipt generation, and comprehensive reporting.

### Key Features

- **User Authentication & Management**: Secure user registration, login, and password reset functionality
- **Product Management**: Create and manage reusable products
- **Payment Link Generation**: Generate unique, shareable payment links with optional expiration and usage limits
- **Mobile Money Payments**: Process payments through MTN, Vodafone, and AirtelTigo mobile money services
- **Transaction Management**: Comprehensive transaction history with filtering and search capabilities
- **Receipt Generation**: Automatic PDF receipt generation and download
- **Email Notifications**: Automated email notifications for payment events
- **Dashboard & Analytics**: Real-time statistics and insights
- **QR Code Support**: Generate QR codes for payment links and receipts

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **API**: REST API
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Queue**: Bull (for email processing)
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **PDF Generation**: PDFKit
- **Email**: Nodemailer (Gmail SMTP)
- **File Storage**: AWS S3
- **QR Codes**: qrcode

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **State Management**: 
  - React Query (server state)
  - Zustand (global UI state)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **QR Codes**: qrcode.react
- **Styling**: CSS Modules / Tailwind CSS (your choice)

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Render
- **File Storage**: AWS S3
- **Payment Provider**: Mansa Transfers API

### Development Tools
- **Language**: TypeScript
- **Testing**: Jest, Supertest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git

---

## 🚀 How to Run the Project Locally

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- AWS Account (for S3)
- Gmail Account (for email)
- Mansa Transfers API credentials

### 1. Clone the Repository

```bash
git clone <repository-url>
cd payment-link-platform
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - AWS_S3_BUCKET_NAME
# - EMAIL_USER
# - EMAIL_PASSWORD
# - MANSA_API_KEY
# - MANSA_API_SECRET

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local file with your configuration
# Required variables:
# - NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Docker Setup (Alternative)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up

# Or run services individually
docker-compose up postgres redis
docker-compose up backend
docker-compose up frontend
```

### 5. Database Setup

```bash
cd backend

# Create database (if not using Docker)
createdb payment_link_platform

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with test data
npx prisma db seed
```

### 6. Verify Installation

1. Backend API: Visit `http://localhost:3000/api` (Swagger documentation)
2. Frontend: Visit `http://localhost:3001`
3. Database: Verify connection in Prisma Studio: `npx prisma studio`

---

## 📁 Project Structure

```
payment-link-platform/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── products/       # Product management
│   │   ├── payment-links/  # Payment link management
│   │   ├── payments/       # Payment processing
│   │   ├── transactions/   # Transaction management
│   │   ├── receipts/       # Receipt generation
│   │   └── notifications/  # Email notifications
│   ├── prisma/             # Prisma schema and migrations
│   └── templates/          # Email templates
│
├── frontend/               # Next.js frontend application
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── stores/             # Zustand stores
│   └── types/              # TypeScript types
│
├── docker-compose.yml      # Docker Compose configuration
└── README.md               # This file
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/payment_link_platform"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRATION="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_REGION="us-east-1"

# Email (Gmail SMTP)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Mansa Transfers API
MANSA_API_KEY="your-api-key"
MANSA_API_SECRET="your-api-secret"
MANSA_API_BASE_URL="https://api-stage.mansatransfers.com"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:3001"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Component tests
npm run test

# E2E tests
npm run test:e2e
```

---

## 🚢 Deployment

### Backend (Render)

1. Connect GitHub repository to Render
2. Create PostgreSQL database on Render
3. Create Redis instance on Render
4. Set environment variables in Render dashboard
5. Deploy service

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy

### AWS S3 Setup

1. Create S3 bucket
2. Configure bucket policies and CORS
3. Create IAM user with S3 permissions
4. Set environment variables

---

## 📚 API Documentation

API documentation is available at `/api` endpoint when running the backend (Swagger/OpenAPI).

Key endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /products` - List products
- `POST /payment-links` - Create payment link
- `POST /payments/initiate` - Initiate payment
- `GET /transactions` - List transactions
- `GET /receipts/:transactionId` - Get receipt

---

## 🎯 Assumptions Made

1. **Payment Provider**: Using Mansa Transfers API as the payment provider for mobile money transactions
2. **Email Service**: Using Gmail SMTP for email notifications (can be upgraded to professional email service)
3. **Storage**: Using AWS S3 for receipt PDF storage
4. **Authentication**: JWT-based authentication with refresh tokens
5. **Currency**: CFA (West African CFA Franc) as the primary currency
6. **Mobile Money Providers**: MTN, Vodafone, and AirtelTigo are the supported providers
7. **Receipt Generation**: Receipts are generated automatically after successful payment
8. **Webhooks**: Payment status updates are received via webhooks from payment provider
9. **Expiration**: Payment links can optionally expire (never expires by default)
10. **Usage Limits**: Payment links can optionally have maximum usage limits (unlimited by default)

---

## ⚠️ Limitations & Possible Improvements

### Current Limitations

1. **Email Service**: Using Gmail SMTP which has rate limits (can be upgraded to professional email service like SendGrid)
2. **Payment Provider**: Limited to Mansa Transfers API (could support multiple providers)
3. **Currency**: Currently supports CFA only (could support multiple currencies)
4. **Receipt Storage**: Receipts stored in AWS S3 (could add local storage option)
5. **Testing**: Basic test coverage (could expand test coverage)
6. **Error Tracking**: No error tracking service (could add Sentry)
7. **Logging**: Basic logging (could add structured logging)
8. **Monitoring**: No application monitoring (could add monitoring tools)
9. **Admin Panel**: No admin panel (could add admin functionality)
10. **Multi-tenancy**: Single-tenant architecture (could support multi-tenancy)

### Possible Improvements

1. **Email Service Upgrade**:
   - Migrate to professional email service (SendGrid, Mailgun)
   - Email templates customization
   - Email analytics

2. **Enhanced Payment Features**:
   - Support for multiple payment providers
   - Payment method selection UI
   - Payment retry mechanism
   - Payment refund functionality

3. **Advanced Features**:
   - Admin panel for system management
   - Multi-currency support
   - Payment link analytics
   - Customer notification preferences
   - Payment link templates
   - Bulk payment link creation

4. **Performance Improvements**:
   - Implement caching strategies
   - Database query optimization
   - CDN for static assets
   - Image optimization

5. **Security Enhancements**:
   - Two-factor authentication (2FA)
   - Rate limiting improvements
   - API key management
   - Webhook signature verification enhancements

6. **Developer Experience**:
   - API documentation improvements
   - SDK/CLI tools
   - Webhook testing tools
   - Development tools

7. **Testing & Quality**:
   - Increase test coverage
   - Integration test suite
   - Performance testing
   - Security testing

8. **Monitoring & Observability**:
   - Error tracking (Sentry)
   - Application monitoring (Datadog, New Relic)
   - Logging service (CloudWatch, Loggly)
   - Analytics dashboard

9. **Scalability**:
   - Horizontal scaling support
   - Database sharding
   - Caching layer improvements
   - Queue system enhancements

10. **User Experience**:
    - Mobile app (React Native)
    - Progressive Web App (PWA)
    - Real-time notifications
    - Enhanced UI/UX

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary and confidential.

---

## 👥 Authors

- Your Name - *Initial work*

---

## 🙏 Acknowledgments

- Mansa Transfers for payment provider API
- NestJS, Next.js, and all open-source libraries used
- All contributors and reviewers

---

## 📞 Support

For support, email support@example.com or open an issue in the repository.

---

**Last Updated**: [Current Date]
**Version**: 1.0.0

