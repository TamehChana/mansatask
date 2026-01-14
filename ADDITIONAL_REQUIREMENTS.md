# Additional Requirements - Payment Link Platform

## Overview
This document covers the additional requirements that must be included in the Payment Link Platform implementation.

---

## 📧 Email Notification After Successful Payment

### Core Requirement
**Email notification must be sent after successful payment**

### Backend Requirements
- **Email Service Setup**
  - Use Nodemailer for email sending
  - Configure Gmail SMTP (or professional email service)
  - Email templates using Handlebars

- **Email Notification Trigger**
  - Trigger email notification when payment status becomes SUCCESS
  - Send from webhook handler (when webhook confirms payment success)
  - Or send from payment status update service

- **Email Content**
  - Payment success notification
  - Transaction details:
    - Amount (CFA)
    - Transaction reference
    - Date/time
    - Customer information
    - Merchant information
  - Receipt attachment (PDF) - optional but recommended
  - Professional email template

- **Email Queue (Recommended)**
  - Use Bull queue for async email sending
  - Retry logic for failed emails
  - Error handling and logging

- **Implementation Location**
  - In webhook handler: When payment status updates to SUCCESS
  - Or in payment service: After successful payment confirmation

### Frontend Requirements
- **Email Preferences (Optional - Future Enhancement)**
  - Email notification settings
  - Toggle for email notifications
  - Email preferences page

### Email Templates Required
- Payment success email
- Payment failed email (optional but recommended)
- Receipt email (with PDF attachment)
- Welcome email (optional)
- Password reset email

---

## 🔔 Webhook Simulation for Payment Success

### Core Requirement
**Webhook simulation tool/endpoint for testing payment success**

### Backend Requirements
- **Webhook Simulation Endpoint (Development/Testing)**
  - Endpoint: `POST /webhooks/simulate` (development only)
  - Purpose: Simulate payment success webhook for testing
  - Security: Only enabled in development/staging (disable in production)
  - Fields:
    - transactionId or externalReference
    - status (SUCCESS, FAILED, etc.)
    - payload (optional - custom webhook payload)

- **Webhook Simulation Service**
  - Simulate webhook payload
  - Process simulation like real webhook
  - Update transaction status
  - Trigger notifications
  - Generate receipt (if success)

- **Alternative: Manual Webhook Testing**
  - Document webhook payload structure
  - Provide example payloads
  - Instructions for testing with tools (Postman, curl, etc.)

### Implementation Options
1. **Development Endpoint** (Recommended)
   - Create `/webhooks/simulate` endpoint
   - Only enabled in development/staging
   - Requires authentication (admin/dev only)

2. **Testing Tools**
   - Document webhook payload format
   - Provide Postman collection
   - Provide curl examples

3. **Local Testing Setup**
   - Use ngrok or similar for local webhook testing
   - Instructions for local webhook testing

---

## 📊 Admin Dashboard Metrics

### Core Requirement
**Admin dashboard with metrics (total sales, number of payments)**

### Backend Requirements
- **Dashboard Endpoint**
  - Endpoint: `GET /dashboard/stats` or `GET /dashboard/metrics`
  - Requires: Authentication
  - Return: Dashboard statistics

- **Metrics to Include**
  - **Total Sales**: Sum of all successful transactions (in CFA)
  - **Number of Payments**: Count of all transactions (or successful only)
  - **Additional Metrics** (Nice-to-have):
    - Total transactions
    - Successful transactions count
    - Failed transactions count
    - Pending transactions count
    - Average transaction amount
    - Total payment links created
    - Active payment links count
    - Total products created

- **Data Aggregation**
  - Query database for metrics
  - Use efficient queries (aggregate functions)
  - Consider caching for performance (Redis)
  - Filter by date range (optional)

- **Authorization**
  - Users can only see their own dashboard metrics
  - No admin role required (each merchant sees their own stats)

### Frontend Requirements
- **Dashboard Page**
  - Display metrics cards:
    - Total Sales (large, prominent)
    - Number of Payments
    - Additional metrics (optional)
  - Charts/graphs (optional - nice-to-have):
    - Sales over time
    - Payment status breakdown
    - Transactions chart
  - Recent transactions list
  - Statistics cards design

- **Dashboard Components**
  - StatsCard component (reusable)
  - Dashboard layout
  - Loading states
  - Error handling

---

## ⏰ Expirable Payment Links

### Core Requirement
**Payment links must support expiration (optional expiration)**

### Backend Requirements
- **Expiration Fields**
  - `expiresAt`: Date/time when link expires (optional)
  - `expiresAfterDays`: Number of days until expiration (alternative)
  - `maxUses`: Maximum number of uses (optional)
  - `currentUses`: Current usage count

- **Expiration Validation**
  - Check expiration when:
    - Getting payment link (public endpoint)
    - Initiating payment
    - Displaying payment link
  - Return error if expired: "Payment link has expired"
  - Return error if max uses reached: "Payment link has reached maximum uses"

- **Expiration Options**
  - Never expires (default - expiresAt = null)
  - Expires in X days (calculate expiresAt from created date)
  - Expires on specific date/time (set expiresAt directly)

- **Implementation**
  - Already discussed in detail in earlier conversation
  - Entity methods: `isExpired()`, `isMaxUsesReached()`, `canBeUsed()`
  - Validation in service layer
  - Clear error messages

### Frontend Requirements
- **Expiration UI**
  - Expiration options in payment link form:
    - Never expires (default)
    - Expires in X days (dropdown: 7, 30, 60, 90 days)
    - Expires on specific date (date picker)
  - Max uses input (optional)
  - Expiration display on payment link cards
  - Expiration warnings (expiring soon)

---

## 📱 QR Code for Payment Links

### Core Requirement
**QR code generation and display for payment links**

### Backend Requirements
- **QR Code Service**
  - Service: `qr-code.service.ts`
  - Generate QR code for payment link
  - Include payment URL in QR code
  - Return: QR code image (base64 or buffer)
  - Library: `qrcode` package

- **QR Code Generation**
  - Generate QR code containing payment link URL
  - Format: `https://yourdomain.com/pay/[slug]`
  - QR code size/format configurable
  - Error correction level (recommended: M or H)

- **QR Code Endpoints** (Optional)
  - `GET /payment-links/:id/qr-code` - Get QR code image
  - Or include QR code in payment link details response

### Frontend Requirements
- **QR Code Display**
  - Display QR code on payment link details page
  - QR code component: `qrcode.react` library
  - Copy/share QR code functionality
  - Download QR code as image (optional)
  - Display QR code on public payment page (optional)

- **QR Code Usage**
  - Merchants can share QR code with customers
  - Customers can scan QR code to open payment link
  - Mobile-friendly QR code display

---

## 🧪 Unit or Integration Tests

### Core Requirement
**Unit or integration tests must be included**

### Backend Testing Requirements
- **Unit Tests**
  - Test services (business logic)
  - Test utilities
  - Test validators
  - Mock dependencies
  - Test error handling

- **Integration Tests**
  - Test API endpoints (controllers)
  - Test database interactions
  - Test external service integrations (mocked)
  - Test authentication/authorization
  - Use test database

- **Critical Paths to Test**
  - Authentication flow (register, login)
  - Payment initiation (with idempotency)
  - Payment link validation
  - Webhook handling
  - Receipt generation
  - Authorization checks (IDOR prevention)

- **Test Coverage**
  - Aim for 80% coverage on services
  - 70% overall coverage minimum
  - Test critical payment flow thoroughly

### Frontend Testing Requirements
- **Component Tests**
  - Test UI components (React Testing Library)
  - Test form validation
  - Test user interactions
  - Test error states

- **Integration Tests**
  - Test user flows
  - Test API integration (mocked)
  - Test state management

- **E2E Tests (Optional)**
  - Test complete payment flow
  - Test authentication flow
  - Use Playwright

### Testing Tools
- **Backend**: Jest, Supertest
- **Frontend**: Jest, React Testing Library, Playwright (optional)
- **Mocking**: MSW (optional), Jest mocks

---

## 🐳 Docker Setup

### Core Requirement
**Docker setup for the project**

### Docker Requirements
- **Dockerfiles**
  - Backend Dockerfile (multi-stage build)
  - Frontend Dockerfile (multi-stage build)
  - Optimized for production
  - Non-root user (security)

- **Docker Compose**
  - `docker-compose.yml` for local development
  - Services:
    - PostgreSQL
    - Redis
    - Backend (optional - for local dev)
    - Frontend (optional - for local dev)
  - Environment variables
  - Volume mounts
  - Network configuration

- **Docker Configuration**
  - `.dockerignore` files
  - Multi-stage builds (production optimization)
  - Health checks (optional)
  - Proper caching

### Docker Setup Benefits
- Consistent development environment
- Easy local setup
- Production-ready containers
- Deployment compatibility

### Docker Files Required
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `.dockerignore` (backend & frontend)

---

## ✅ Complete Requirements Checklist

### Must-Have Requirements (All Features)
- [x] Authentication & User Management
- [x] Product & Payment Link Creation
- [x] Public Payment Page (Client Side)
- [x] Payment Flow (Mobile Money)
- [x] Receipt Generation & Download
- [x] **Email notification after successful payment** ✅
- [x] **Webhook simulation for payment success** ✅
- [x] **Admin dashboard metrics (total sales, number of payments)** ✅
- [x] **Expirable payment links** ✅
- [x] **QR code for payment links** ✅
- [x] **Unit or integration tests** ✅
- [x] **Docker setup** ✅

---

## 📝 Summary

All additional requirements are now documented:

1. **Email Notification After Successful Payment** ✅
   - Trigger on payment success
   - Email with transaction details
   - Optional: Receipt attachment

2. **Webhook Simulation for Payment Success** ✅
   - Development endpoint for testing
   - Simulate webhook payloads
   - Testing documentation

3. **Admin Dashboard Metrics** ✅
   - Total sales (in CFA)
   - Number of payments
   - Additional metrics (optional)

4. **Expirable Payment Links** ✅
   - Optional expiration (days or date)
   - Max uses support
   - Validation and error handling

5. **QR Code for Payment Links** ✅
   - Generate QR codes
   - Display on payment link details
   - Share functionality

6. **Unit or Integration Tests** ✅
   - Backend tests (Jest, Supertest)
   - Frontend tests (Jest, React Testing Library)
   - Critical path coverage

7. **Docker Setup** ✅
   - Dockerfiles (backend & frontend)
   - Docker Compose
   - Local development setup

---

**All requirements are now comprehensively documented and ready for implementation!**


