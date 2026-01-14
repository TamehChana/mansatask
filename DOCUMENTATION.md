# Payment Link Platform - Technical Documentation

Complete technical documentation for the Payment Link Platform, including API specifications, architecture details, database schema, and system workflows.

## Table of Contents

1. [API Documentation](#api-documentation)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Payment Flow](#payment-flow)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)

## API Documentation

### Base URL

- Development: `http://localhost:3000/api`
- Production: `https://payment-link-backend.onrender.com/api`

### Interactive API Documentation

Swagger/OpenAPI documentation is available in development mode at:
- Swagger UI: `http://localhost:3000/api/docs`

### Authentication

All authenticated endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the refresh token endpoint to obtain new access tokens.

Refresh tokens expire after 7 days.

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    {
      "property": "fieldName",
      "constraints": {
        "constraintName": "Constraint message"
      }
    }
  ],
  "timestamp": "2024-01-14T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### API Endpoints

#### Authentication Endpoints

##### Register User
- **Endpoint**: `POST /api/auth/register`
- **Authentication**: Not required
- **Rate Limit**: 5 requests per minute
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```
- **Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

##### Login
- **Endpoint**: `POST /api/auth/login`
- **Authentication**: Not required
- **Rate Limit**: 5 requests per minute
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

##### Refresh Token
- **Endpoint**: `POST /api/auth/refresh`
- **Authentication**: Refresh token required
- **Rate Limit**: 10 requests per minute
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

##### Forgot Password
- **Endpoint**: `POST /api/auth/forgot-password`
- **Authentication**: Not required
- **Rate Limit**: 3 requests per minute
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

##### Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Authentication**: Not required
- **Request Body**:
```json
{
  "token": "reset_token",
  "password": "NewSecurePassword123!"
}
```
- **Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### User Endpoints

##### Get Profile
- **Endpoint**: `GET /api/users/profile`
- **Authentication**: Required
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+233 XX XXX XXXX",
    "role": "MERCHANT",
    "createdAt": "2024-01-14T00:00:00.000Z",
    "updatedAt": "2024-01-14T00:00:00.000Z"
  }
}
```

##### Update Profile
- **Endpoint**: `PUT /api/users/profile`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com",
  "phone": "+233 XX XXX XXXX"
}
```
- **Response** (200 OK): Updated user profile

#### Product Endpoints

##### List Products
- **Endpoint**: `GET /api/products`
- **Authentication**: Required
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `search` (optional): Search term
- **Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": "10000.00",
      "imageUrl": "https://...",
      "quantity": 100,
      "createdAt": "2024-01-14T00:00:00.000Z",
      "updatedAt": "2024-01-14T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

##### Create Product
- **Endpoint**: `POST /api/products`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 10000,
  "quantity": 100,
  "imageUrl": "https://..."
}
```
- **Response** (201 Created): Created product object

##### Get Product
- **Endpoint**: `GET /api/products/:id`
- **Authentication**: Required
- **Response** (200 OK): Product object

##### Update Product
- **Endpoint**: `PATCH /api/products/:id`
- **Authentication**: Required
- **Request Body**: Partial product data
- **Response** (200 OK): Updated product object

##### Delete Product
- **Endpoint**: `DELETE /api/products/:id`
- **Authentication**: Required
- **Response** (200 OK):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

##### Upload Product Image
- **Endpoint**: `POST /api/products/upload-image`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Request Body**: Form data with `image` file
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://s3.amazonaws.com/..."
  }
}
```

#### Payment Link Endpoints

##### List Payment Links
- **Endpoint**: `GET /api/payment-links`
- **Authentication**: Required
- **Query Parameters**: `page`, `limit`, `search`, `isActive`
- **Response** (200 OK): Array of payment links with pagination

##### Create Payment Link
- **Endpoint**: `POST /api/payment-links`
- **Authentication**: Required
- **Request Body**:
```json
{
  "title": "Payment Link Title",
  "description": "Payment link description",
  "amount": "10000.00",
  "productId": "uuid",
  "expiresAfterDays": 30,
  "maxUses": 100
}
```
- **Response** (201 Created): Created payment link with slug

##### Get Payment Link
- **Endpoint**: `GET /api/payment-links/:id`
- **Authentication**: Required
- **Response** (200 OK): Payment link object

##### Update Payment Link
- **Endpoint**: `PATCH /api/payment-links/:id`
- **Authentication**: Required
- **Request Body**: Partial payment link data
- **Response** (200 OK): Updated payment link object

##### Delete Payment Link
- **Endpoint**: `DELETE /api/payment-links/:id`
- **Authentication**: Required
- **Response** (200 OK): Success message

##### Get Public Payment Link
- **Endpoint**: `GET /api/payment-links/public/:slug`
- **Authentication**: Not required
- **Response** (200 OK): Payment link object with product and merchant information

#### Payment Endpoints

##### Initiate Payment
- **Endpoint**: `POST /api/payments/initiate`
- **Authentication**: Not required (public endpoint)
- **Headers**:
  - `Idempotency-Key`: Required unique key to prevent duplicate payments
- **Request Body**:
```json
{
  "paymentLinkId": "uuid",
  "customerName": "Customer Name",
  "customerPhone": "+233 XX XXX XXXX",
  "customerEmail": "customer@example.com",
  "paymentProvider": "MTN"
}
```
- **Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "externalReference": "TXN-...",
    "status": "PENDING",
    "amount": "10000.00",
    "providerTransactionId": "provider_id"
  }
}
```

##### Get Payment Status
- **Endpoint**: `GET /api/payments/status/:externalReference`
- **Authentication**: Not required (public endpoint)
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "externalReference": "TXN-...",
    "status": "SUCCESS",
    "amount": "10000.00",
    "customerName": "Customer Name",
    "customerPhone": "+233 XX XXX XXXX",
    "provider": "MTN",
    "providerTransactionId": "provider_id",
    "createdAt": "2024-01-14T00:00:00.000Z",
    "updatedAt": "2024-01-14T00:00:00.000Z"
  }
}
```

#### Transaction Endpoints

##### List Transactions
- **Endpoint**: `GET /api/transactions`
- **Authentication**: Required
- **Query Parameters**: `page`, `limit`, `status`, `startDate`, `endDate`
- **Response** (200 OK): Array of transactions with pagination

##### Get Transaction
- **Endpoint**: `GET /api/transactions/:id`
- **Authentication**: Required
- **Response** (200 OK): Transaction object with receipt information

#### Receipt Endpoints

##### Get Receipt
- **Endpoint**: `GET /api/receipts/:transactionId`
- **Authentication**: Required
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "receiptNumber": "RCP-2026-...",
    "pdfUrl": "https://s3.amazonaws.com/...",
    "transactionId": "uuid",
    "createdAt": "2024-01-14T00:00:00.000Z"
  }
}
```

##### Download Receipt
- **Endpoint**: `GET /api/receipts/:transactionId/download`
- **Authentication**: Required
- **Response**: PDF file download

##### Download Public Receipt
- **Endpoint**: `GET /api/receipts/public/:externalReference/download`
- **Authentication**: Not required
- **Response**: PDF file download

#### Webhook Endpoints

##### Payment Webhook
- **Endpoint**: `POST /api/webhooks/payment`
- **Authentication**: Webhook signature verification required
- **Headers**:
  - `X-Webhook-Signature`: HMAC signature of the request body
- **Request Body**: Payment provider webhook payload
- **Response** (200 OK):
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

#### Dashboard Endpoints

##### Get Dashboard Statistics
- **Endpoint**: `GET /api/dashboard/stats`
- **Authentication**: Required
- **Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalRevenue": "1000000.00",
    "totalTransactions": 150,
    "successfulTransactions": 140,
    "failedTransactions": 10,
    "activePaymentLinks": 25,
    "totalProducts": 50
  }
}
```

#### Health Check

##### Health Check
- **Endpoint**: `GET /api/health`
- **Authentication**: Not required
- **Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-14T00:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 5
    },
    "redis": {
      "status": "healthy",
      "responseTime": 2
    }
  }
}
```

## Architecture

### System Architecture

The Payment Link Platform follows a modular, feature-based architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  - React 19                                                  │
│  - Next.js 16 (App Router)                                   │
│  - Zustand (State Management)                                │
│  - React Query (Server State)                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/REST API
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    Backend (NestJS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │  Products    │  │  Payment     │      │
│  │   Module     │  │  Module      │  │  Links       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Payments    │  │ Transactions │  │  Receipts    │      │
│  │  Module      │  │  Module      │  │  Module      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────┬──────────────────────────────────┬──────────────┘
            │                                  │
    ┌───────┴────────┐                ┌───────┴────────┐
    │  PostgreSQL    │                │     Redis      │
    │  (Database)    │                │     (Cache)    │
    └────────────────┘                └────────────────┘
            │                                  │
            └───────────┬──────────────────────┘
                        │
            ┌───────────┴───────────┐
            │   External Services   │
            │  - Mansa Transfers    │
            │  - SendGrid           │
            │  - AWS S3             │
            └───────────────────────┘
```

### Module Structure

The backend follows a feature-based module structure:

- **Auth Module**: User registration, login, password reset, JWT token management
- **Users Module**: User profile management
- **Products Module**: Product CRUD operations, image upload
- **Payment Links Module**: Payment link creation, management, public access
- **Payments Module**: Payment initiation, status checking, provider integration
- **Transactions Module**: Transaction history and details
- **Receipts Module**: PDF receipt generation and storage
- **Webhooks Module**: Payment provider webhook handling
- **Dashboard Module**: Statistics and analytics
- **Email Module**: Email notification service
- **Storage Module**: File storage (S3) abstraction

### Data Flow

1. **User Registration/Login**:
   - Frontend → Auth Module → Database → JWT tokens → Frontend

2. **Payment Link Creation**:
   - Frontend → Payment Links Module → Database → Payment Link with slug → Frontend

3. **Payment Flow**:
   - Customer → Public Payment Page → Payment Initiation → Mansa Transfers API
   - Webhook → Webhook Module → Transaction Update → Receipt Generation → Email Notification

4. **Transaction Query**:
   - Frontend → Transactions Module → Database → Transaction Data → Frontend

## Database Schema

### Core Entities

#### User
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `name`: String
- `phone`: String (Optional)
- `password`: String (Hashed with bcrypt)
- `role`: Enum (MERCHANT, ADMIN)
- `passwordResetToken`: String (Optional)
- `passwordResetExpires`: DateTime (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**:
- Has many Products
- Has many Payment Links
- Has many Transactions

#### Product
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key → User)
- `name`: String
- `description`: String (Optional)
- `price`: Decimal(10, 2) (CFA)
- `imageUrl`: String (Optional)
- `quantity`: Integer
- `deletedAt`: DateTime (Optional, Soft Delete)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**:
- Belongs to User
- Has many Payment Links

#### Payment Link
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key → User)
- `productId`: UUID (Foreign Key → Product, Optional)
- `title`: String
- `description`: String (Optional)
- `amount`: Decimal(10, 2) (CFA)
- `slug`: String (Unique)
- `isActive`: Boolean
- `expiresAt`: DateTime (Optional)
- `expiresAfterDays`: Integer (Optional)
- `maxUses`: Integer (Optional)
- `currentUses`: Integer
- `deletedAt`: DateTime (Optional, Soft Delete)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**:
- Belongs to User
- Belongs to Product (Optional)
- Has many Transactions

#### Transaction
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key → User)
- `paymentLinkId`: UUID (Foreign Key → Payment Link)
- `externalReference`: String (Unique)
- `providerTransactionId`: String (Optional)
- `status`: Enum (PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED)
- `provider`: Enum (MTN, VODAFONE, AIRTELTIGO)
- `customerName`: String
- `customerPhone`: String
- `customerEmail`: String (Optional)
- `amount`: Decimal(10, 2) (CFA)
- `failureReason`: String (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**:
- Belongs to User
- Belongs to Payment Link
- Has one Receipt

#### Receipt
- `id`: UUID (Primary Key)
- `transactionId`: UUID (Foreign Key → Transaction, Unique)
- `receiptNumber`: String (Unique)
- `pdfUrl`: String (S3 URL)
- `createdAt`: DateTime

**Relationships**:
- Belongs to Transaction (One-to-One)

### Database Indexes

- `users.email`: Unique index
- `products.userId`: Index for user queries
- `products.userId, products.deletedAt`: Composite index
- `payment_links.userId`: Index for user queries
- `payment_links.slug`: Unique index
- `transactions.userId`: Index for user queries
- `transactions.externalReference`: Unique index
- `receipts.transactionId`: Unique index

## Authentication & Authorization

### Authentication Flow

1. **Registration/Login**:
   - User submits credentials
   - Backend validates and generates JWT tokens
   - Access token (15 minutes) and refresh token (7 days) returned

2. **Token Refresh**:
   - Frontend uses refresh token to obtain new access token
   - Refresh token validated via JwtRefreshGuard

3. **Protected Endpoints**:
   - Access token validated via JwtAuthGuard
   - User information extracted from token
   - Request proceeds if token valid

### Authorization

- **Resource Ownership**: Users can only access their own resources
- **IDOR Prevention**: All endpoints verify resource ownership
- **Role-Based Access**: Admin role exists in schema but not yet implemented

### Password Security

- Passwords hashed using bcrypt with 10 salt rounds
- Password reset tokens expire after 1 hour
- Password reset tokens are single-use

## Payment Flow

### Payment States

- **PENDING**: Payment initiated, awaiting provider confirmation
- **PROCESSING**: Payment being processed by provider
- **SUCCESS**: Payment completed successfully
- **FAILED**: Payment failed (with reason)
- **CANCELLED**: Payment cancelled by user or timeout

### Payment Flow Steps

1. **Initiation**:
   - Customer fills payment form on public payment page
   - Frontend sends payment initiation request with idempotency key
   - Backend validates payment link (active, not expired, not max uses)
   - Transaction record created with PENDING status
   - Payment request sent to Mansa Transfers API
   - Provider transaction ID stored
   - Transaction reference returned to customer

2. **Status Checking**:
   - Frontend polls payment status endpoint
   - Backend checks transaction status with provider
   - Status updated in database
   - Response returned to frontend

3. **Webhook Processing**:
   - Payment provider sends webhook with status update
   - Backend verifies webhook signature
   - Transaction status updated in database
   - If successful: Receipt generated, email sent, product quantity decremented
   - Webhook acknowledged

4. **Receipt Generation**:
   - Triggered automatically on successful payment
   - PDF generated with transaction details, merchant information, QR code
   - PDF uploaded to S3
   - Receipt record created in database
   - Receipt URL stored in transaction

### Idempotency

- All payment initiation requests require an idempotency key
- Idempotency keys stored in Redis with TTL
- Duplicate requests with same key return existing transaction
- Prevents duplicate payment processing

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    {
      "property": "fieldName",
      "constraints": {
        "constraintName": "Constraint message"
      }
    }
  ],
  "timestamp": "2024-01-14T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST requests creating resources
- **400 Bad Request**: Validation errors, invalid input
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authorized but not permitted (resource ownership)
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server errors (not exposed to clients)

### Error Types

1. **Validation Errors**: Input validation failures (400)
2. **Authentication Errors**: Invalid or missing tokens (401)
3. **Authorization Errors**: Resource ownership violations (403)
4. **Not Found Errors**: Resources not found (404)
5. **Rate Limit Errors**: Too many requests (429)
6. **Server Errors**: Internal errors (500, message not exposed)

## Security Considerations

### Input Validation

- All inputs validated using DTOs with class-validator
- Validation pipes configured with whitelist and forbidNonWhitelisted
- Frontend validation using Zod schemas

### Authentication Security

- JWT tokens signed with secure secrets
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Tokens stored securely (httpOnly cookies or memory)
- Password hashing with bcrypt (10 salt rounds)

### Authorization Security

- Resource ownership verification on all endpoints
- IDOR prevention through authorization checks
- Users can only access their own data

### Rate Limiting

- All endpoints have rate limiting enabled
- Stricter limits on authentication endpoints
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

### Security Headers

- Helmet middleware configured for security headers
- CORS configured to allow only authorized origins
- HTTPS enforced in production
- Content Security Policy enabled in production

### Data Protection

- Sensitive data never exposed in error responses
- Passwords never returned in API responses
- Internal errors logged but not exposed to clients
- Webhook signatures verified

### Payment Security

- Idempotency keys prevent duplicate payments
- Webhook signatures verified
- Transaction state tracked explicitly
- Payment links validated before processing
- Payment status verified with provider

