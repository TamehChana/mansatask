# Payment Link Platform - Core Requirements

## Overview
Comprehensive core requirements document based on the interview assessment. This document outlines all critical requirements for each major feature area.

**Currency**: CFA (West African CFA Franc)
**Payment Provider API**: Mansa Transfers API (`https://api-stage.mansatransfers.com`)
**API Documentation**: Refer to the PDF document for detailed API specifications

---

## 🔐 1. Authentication & User Management

### 1.1 Authentication Requirements

#### Backend Requirements
- **User Registration**
  - Endpoint: `POST /auth/register`
  - Fields: name, email, password
  - Password hashing (bcrypt)
  - Email validation
  - Duplicate email check
  - Return: User data + access token + refresh token

- **User Login**
  - Endpoint: `POST /auth/login`
  - Fields: email, password
  - Password verification
  - JWT token generation (access + refresh)
  - Return: User data + access token + refresh token

- **Token Refresh**
  - Endpoint: `POST /auth/refresh`
  - Validate refresh token
  - Generate new access token
  - Return: New access token

- **Password Reset**
  - Forgot Password: `POST /auth/forgot-password`
    - Email input
    - Generate secure reset token
    - Send reset email
    - Token expiration (e.g., 1 hour)
  - Reset Password: `POST /auth/reset-password`
    - Reset token + new password
    - Validate token
    - Update password
    - Invalidate token

- **Security Requirements**
  - JWT authentication
  - Access token: Short-lived (15-30 minutes)
  - Refresh token: Long-lived (7 days)
  - Password hashing: bcrypt (salt rounds: 10)
  - Password reset token: Hashed, with expiration
  - Rate limiting on auth endpoints

#### Frontend Requirements
- **Login Page**
  - Email/username input
  - Password input
  - Login button
  - "Forgot password?" link
  - "Sign up" link
  - Form validation
  - Error handling

- **Registration Page**
  - Name input
  - Email input
  - Password input
  - Confirm password input
  - Terms and conditions checkbox
  - Sign up button
  - "Already have account? Login" link
  - Form validation
  - Error handling

- **Forgot Password Page**
  - Email input
  - Send reset link button
  - Back to login link
  - Instructions text
  - Success message

- **Reset Password Page**
  - New password input
  - Confirm password input
  - Reset password button
  - Password strength indicator
  - Success/error handling

- **Auth State Management (Zustand)**
  - User state storage
  - Token management
  - Auth status (authenticated/not authenticated)
  - Logout functionality
  - Token refresh logic

- **Protected Routes**
  - Auth guard component
  - Redirect to login if not authenticated
  - Preserve intended destination

### 1.2 User Management Requirements

#### Backend Requirements
- **Get User Profile**
  - Endpoint: `GET /users/me` or `GET /users/profile`
  - Requires: Authentication
  - Return: User data (name, email, etc.)
  - Authorization: User can only access their own profile

- **Update User Profile**
  - Endpoint: `PUT /users/profile`
  - Requires: Authentication
  - Fields: name, email (optional fields)
  - Validation: Email format, unique email check
  - Authorization: User can only update their own profile
  - Return: Updated user data

- **Security Requirements**
  - All endpoints require authentication
  - User ownership checks (prevent IDOR)
  - Input validation (DTOs)
  - No password exposure in responses

#### Frontend Requirements
- **User Profile Page**
  - Display user information
  - Edit profile form
  - Update button
  - Success/error feedback
  - Form validation

---

## 📦 2. Product & Payment Link Creation

### 2.1 Product Management Requirements

#### Backend Requirements
- **Create Product**
  - Endpoint: `POST /products`
  - Requires: Authentication
  - Fields: name, description, price (in CFA)
  - Validation:
    - Name: Required, min length
    - Description: Optional
    - Price: Required, positive number, minimum value
  - Store: userId (link to merchant)
  - Return: Created product data
  - Authorization: User can only create products for themselves

- **List Products**
  - Endpoint: `GET /products`
  - Requires: Authentication
  - Filter: Only products belonging to authenticated user
  - Pagination: Optional
  - Return: List of products
  - Authorization: User can only see their own products

- **Get Product**
  - Endpoint: `GET /products/:id`
  - Requires: Authentication
  - Return: Product data
  - Authorization: User can only access their own products

- **Update Product**
  - Endpoint: `PUT /products/:id`
  - Requires: Authentication
  - Fields: name, description, price
  - Validation: Same as create
  - Return: Updated product data
  - Authorization: User can only update their own products

- **Delete Product**
  - Endpoint: `DELETE /products/:id`
  - Requires: Authentication
  - Soft delete (recommended)
  - Return: Success message
  - Authorization: User can only delete their own products

#### Frontend Requirements
- **Product List Page**
  - Display all user's products
  - Product cards/table view
  - Create product button
  - Edit/Delete actions
  - Search/filter (optional)
  - Empty state

- **Create Product Page**
  - Product form:
    - Name input
    - Description textarea
    - Price input (CFA)
  - Create button
  - Cancel button
  - Form validation (Zod)
  - Error handling
  - Success feedback

- **Edit Product Page**
  - Pre-filled product form
  - Update button
  - Delete button
  - Cancel button
  - Form validation
  - Success/error feedback

### 2.2 Payment Link Management Requirements

#### Backend Requirements
- **Create Payment Link**
  - Endpoint: `POST /payment-links`
  - Requires: Authentication
  - Fields:
    - title (required)
    - description (optional)
    - amount (required, in CFA)
    - productId (optional - link to existing product)
    - expiresAfterDays (optional - number of days)
    - expiresAt (optional - specific date)
    - maxUses (optional - maximum uses)
  - Generate: Unique slug (e.g., `pay-abc123xyz`)
  - Store: userId, productId (optional), slug, expiration, maxUses
  - Return: Payment link data (including slug)
  - Authorization: User can only create links for themselves

- **List Payment Links**
  - Endpoint: `GET /payment-links`
  - Requires: Authentication
  - Filter: Only links belonging to authenticated user
  - Filters: status, expiration status (optional)
  - Pagination: Optional
  - Return: List of payment links
  - Authorization: User can only see their own links

- **Get Payment Link**
  - Endpoint: `GET /payment-links/:id`
  - Requires: Authentication
  - Return: Payment link data
  - Authorization: User can only access their own links

- **Get Public Payment Link (by slug)**
  - Endpoint: `GET /payment-links/public/:slug`
  - Public: No authentication required
  - Validation: Check if link is active, not expired, not max uses reached
  - Return: Payment link data (for display on public page)
  - Error: If expired/inactive/max uses reached

- **Update Payment Link**
  - Endpoint: `PUT /payment-links/:id`
  - Requires: Authentication
  - Fields: Same as create (except slug)
  - Validation: Same as create
  - Return: Updated payment link data
  - Authorization: User can only update their own links

- **Delete Payment Link**
  - Endpoint: `DELETE /payment-links/:id`
  - Requires: Authentication
  - Soft delete (recommended)
  - Return: Success message
  - Authorization: User can only delete their own links

- **QR Code Generation**
  - Generate QR code for payment link
  - Include payment URL in QR code
  - Return: QR code image/URL
  - Service: `qr-code.service.ts`

#### Frontend Requirements
- **Payment Link List Page**
  - Display all user's payment links
  - Link cards/table view
  - Status indicators (Active, Expired, Max uses reached)
  - Expiration date display
  - Create link button
  - Edit/Copy/Delete actions
  - QR code display
  - Share options
  - Search/filter (optional)

- **Create Payment Link Page**
  - Payment link form:
    - Title input
    - Description textarea
    - Amount input (CFA)
    - Product selector (optional - select existing product OR enter custom details)
    - Expiration options:
      - Never expires (default)
      - Expires in X days
      - Expires on specific date
    - Max uses input (optional)
  - Generate link button
  - Cancel button
  - Form validation
  - Success feedback (with link URL)

- **Edit Payment Link Page**
  - Pre-filled payment link form
  - Update button
  - Delete button
  - Cancel button
  - Form validation
  - Success/error feedback

- **Payment Link Details Page**
  - Display payment link information
  - Payment URL display
  - Copy link button
  - QR code display
  - Share options
  - Statistics (views, payments) - optional
  - Status toggle (Active/Pause) - optional

---

## 🌐 3. Public Payment Page (Client Side)

### 3.1 Public Payment Page Requirements

#### Backend Requirements
- **Get Public Payment Link**
  - Endpoint: `GET /payment-links/public/:slug`
  - Public: No authentication required
  - Validation:
    - Link exists
    - Link is active
    - Link is not expired
    - Link has not reached max uses
  - Return: Payment link data (title, description, amount, merchant info)
  - Error: If link is invalid/expired/inactive

#### Frontend Requirements
- **Public Payment Page (`/pay/[slug]`)**
  - **Public**: No authentication required
  - **Display**:
    - Merchant/business branding (name, logo - optional)
    - Product/service information (title, description)
    - Amount to pay (large, prominent) - in CFA
    - Payment link details
  - **Payment Form**:
    - Customer name input (required)
    - Customer email input (optional)
    - Customer phone number input (required)
    - Additional notes textarea (optional)
  - **Payment Method**:
    - Display: Mobile Money indicator
    - Network selection (MTN, Vodafone, AirtelTigo)
  - **Actions**:
    - "Pay Now" button (prominent CTA)
    - Security badges/trust indicators
    - Terms of service link
  - **Validation**:
    - Form validation (Zod)
    - Phone number validation
    - Email validation (if provided)
  - **Error Handling**:
    - Link expired error
    - Link inactive error
    - Max uses reached error
    - Network errors
  - **Responsive**: Mobile-optimized, works on all devices

- **Payment Processing/Loading Page**
  - Loading indicator/animation
  - Status message ("Processing your payment...")
  - Instructions ("Check your phone for payment prompt")
  - Do not refresh warning
  - Redirect to status page after initiation

---

## 💳 4. Payment Flow (Mobile Money)

### 4.1 Payment Initiation Requirements

#### Backend Requirements (Based on Mansa Transfers API)
- **Initiate Payment**
  - Endpoint: `POST /payments/initiate`
  - Public: No authentication required (but validate payment link)
  - **Idempotency**: Required - Use idempotency key header
  - **Fields**:
    - paymentLinkId (or slug)
    - customerName (required)
    - customerPhone (required)
    - customerEmail (optional)
    - paymentProvider (MTN, VODAFONE, AIRTELTIGO)
    - idempotencyKey (header)
  - **Validation**:
    - Payment link exists and is valid
    - Payment link is active
    - Payment link is not expired
    - Payment link has not reached max uses
    - Amount is valid
    - Customer details are valid
    - Phone number format validation
  - **Process**:
    1. Check idempotency key (Redis)
    2. Validate payment link
    3. Create transaction record (status: PENDING)
    4. Generate unique external reference
    5. Call Mansa Transfers API to initiate payment
    6. Store provider transaction ID
    7. Store idempotency key response
    8. Return transaction reference to client
  - **Error Handling**:
    - Payment link invalid/expired/inactive
    - Idempotency key conflict (return existing response)
    - Payment provider API errors
    - Network errors (retry logic)
  - **Return**: Transaction reference (external reference)

- **Check Payment Status**
  - Endpoint: `GET /payments/status/:externalReference`
  - Public: No authentication required
  - Return: Transaction status and details
  - Error: If transaction not found

- **Get Transaction (Protected)**
  - Endpoint: `GET /transactions/:id`
  - Requires: Authentication
  - Return: Transaction details
  - Authorization: User can only access their own transactions

#### Frontend Requirements
- **Payment Initiation**
  - Collect customer details from form
  - Select payment provider (MTN, Vodafone, AirtelTigo)
  - Generate idempotency key (client-side)
  - Call initiate payment API
  - Handle loading state
  - Handle errors
  - Redirect to payment status page

- **Payment Status Page (`/payment-status/[transactionId]`)**
  - **Public**: No authentication required (but can verify with external reference)
  - **Display**:
    - Transaction status (PENDING, PROCESSING, SUCCESS, FAILED)
    - Status icon and message
    - Transaction ID/Reference number
    - Transaction details:
      - Amount (in CFA)
      - Date
      - Customer info
      - Merchant info
      - Payment provider
  - **Status-Specific Actions**:
    - **SUCCESS**:
      - Download Receipt button
      - Return to Home link
      - Success message
    - **FAILED**:
      - Retry Payment button
      - Error message (user-friendly)
      - Contact Support link
    - **PENDING/PROCESSING**:
      - Status explanation
      - Check Status button (polling)
      - Loading indicator
  - **Real-Time Updates**:
    - Poll payment status API
    - Update UI when status changes
    - Stop polling when status is final (SUCCESS/FAILED)

- **Payment Provider Integration**
  - Follow Mansa Transfers API documentation from PDF
  - Handle API errors gracefully
  - Retry logic for transient failures
  - Error messages: User-friendly, not technical

### 4.2 Webhook Handling Requirements

#### Backend Requirements
- **Webhook Endpoint**
  - Endpoint: `POST /webhooks/payment`
  - Public: No authentication (but verify signature)
  - **Security**:
    - Verify webhook signature (if provided by Mansa Transfers API)
    - Validate webhook payload
  - **Process**:
    1. Verify webhook signature
    2. Check for duplicate webhooks (idempotency)
    3. Find transaction by provider transaction ID
    4. Update transaction status
    5. Trigger notifications (if needed)
    6. Generate receipt (if payment successful)
  - **Error Handling**:
    - Invalid signature (reject)
    - Duplicate webhook (ignore)
    - Transaction not found (log error)
    - Status update failures (retry)

---

## 🧾 5. Receipt Generation & Download

### 5.1 Receipt Generation Requirements

#### Backend Requirements
- **Generate Receipt**
  - Endpoint: `POST /receipts/generate/:transactionId` (optional - can be automatic)
  - Requires: Authentication (or automatic on payment success)
  - **Process**:
    1. Fetch transaction (must be SUCCESS status)
    2. Check if receipt already exists
    3. Generate unique receipt number (e.g., `RCP-2024-001234`)
    4. Generate PDF using PDFKit:
       - Merchant information
       - Customer information
       - Transaction details (amount in CFA, date, reference)
       - Payment method
       - Receipt number
       - QR code (optional)
    5. Upload PDF to AWS S3
    6. Store receipt record (receipt number, S3 URL, transaction ID)
    7. Return receipt data
  - **Auto-Generation**: Automatically generate receipt when payment status becomes SUCCESS

- **Get Receipt**
  - Endpoint: `GET /receipts/:transactionId`
  - Requires: Authentication
  - Return: Receipt data (URL, receipt number)
  - Authorization: User can only access receipts for their own transactions

- **Download Receipt**
  - Endpoint: `GET /receipts/:transactionId/download`
  - Requires: Authentication (or public with external reference)
  - Process: Download PDF from S3, return to client
  - Authorization: User can only download receipts for their own transactions (or public with valid reference)

- **Receipt Content Requirements**
  - Receipt number (unique)
  - Date and time
  - Amount paid (in CFA)
  - Customer information (name, phone, email if available)
  - Merchant/Business information
  - Payment method (Mobile Money provider)
  - Transaction status (SUCCESS)
  - Transaction reference/ID
  - QR code (optional - for verification)

#### Frontend Requirements
- **Receipt Display Page**
  - Display receipt information
  - Receipt number
  - Transaction details
  - Download PDF button
  - Print button (optional)
  - Share receipt option (optional)
  - Professional receipt design

- **Receipt Download**
  - Download PDF receipt
  - Handle download errors
  - Success feedback

---

## 📧 6. Email Notification After Successful Payment

### Core Requirement
**Email notification must be sent after successful payment**

#### Backend Requirements
- **Email Service Setup**
  - Use Nodemailer for email sending
  - Configure Gmail SMTP
  - Email templates using Handlebars

- **Email Notification Trigger**
  - Trigger email notification when payment status becomes SUCCESS
  - Send from webhook handler (when webhook confirms payment success)
  - Process: Automatic email sending on payment success

- **Email Content**
  - Payment success notification
  - Transaction details:
    - Amount (in CFA)
    - Transaction reference
    - Date/time
    - Customer information
    - Merchant information
  - Receipt attachment (PDF) - recommended
  - Professional email template

- **Email Queue (Recommended)**
  - Use Bull queue for async email sending
  - Retry logic for failed emails
  - Error handling and logging

- **Implementation Location**
  - In webhook handler: When payment status updates to SUCCESS
  - Or in payment service: After successful payment confirmation

---

## 🔔 7. Webhook Simulation for Payment Success

### Core Requirement
**Webhook simulation tool/endpoint for testing payment success**

#### Backend Requirements
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

---

## 📊 8. Admin Dashboard Metrics

### Core Requirement
**Admin dashboard with metrics (total sales, number of payments)**

#### Backend Requirements
- **Dashboard Endpoint**
  - Endpoint: `GET /dashboard/stats` or `GET /dashboard/metrics`
  - Requires: Authentication
  - Return: Dashboard statistics

- **Metrics to Include (Required)**
  - **Total Sales**: Sum of all successful transactions (in CFA)
  - **Number of Payments**: Count of all transactions (or successful only)
  
- **Additional Metrics (Optional - Nice-to-have)**
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

#### Frontend Requirements
- **Dashboard Page**
  - Display metrics cards:
    - Total Sales (large, prominent, in CFA)
    - Number of Payments
    - Additional metrics (optional)
  - Charts/graphs (optional - nice-to-have):
    - Sales over time
    - Payment status breakdown
    - Transactions chart
  - Recent transactions list
  - Statistics cards design

---

## ⏰ 9. Expirable Payment Links

### Core Requirement
**Payment links must support expiration (optional expiration)**

#### Backend Requirements
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

#### Frontend Requirements
- **Expiration UI**
  - Expiration options in payment link form:
    - Never expires (default)
    - Expires in X days (dropdown: 7, 30, 60, 90 days)
    - Expires on specific date (date picker)
  - Max uses input (optional)
  - Expiration display on payment link cards
  - Expiration warnings (expiring soon)

---

## 📱 10. QR Code for Payment Links

### Core Requirement
**QR code generation and display for payment links**

#### Backend Requirements
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

#### Frontend Requirements
- **QR Code Display**
  - Display QR code on payment link details page
  - QR code component: `qrcode.react` library
  - Copy/share QR code functionality
  - Download QR code as image (optional)
  - Display QR code on public payment page (optional)

---

## 🧪 11. Unit or Integration Tests

### Core Requirement
**Unit or integration tests must be included**

#### Backend Testing Requirements
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

#### Frontend Testing Requirements
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

---

## 🐳 12. Docker Setup

### Core Requirement
**Docker setup for the project**

#### Docker Requirements
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

---

## 💰 Currency & Amount Formatting

### Currency Requirements
- **Currency**: CFA (West African CFA Franc)
- **Symbol**: CFA or XOF
- **Formatting**: 
  - Display: "1,000 CFA" or "1 000 CFA"
  - Input: Accept decimal values (e.g., 1000.50)
  - Storage: Decimal type in database
  - Precision: 2 decimal places

### Amount Validation
- Minimum amount: Validate minimum payment amount (check API docs)
- Maximum amount: Validate maximum payment amount (if applicable)
- Decimal places: 2 decimal places for CFA

---

## 🔐 Security Requirements (All Features)

### General Security
- **Input Validation**: All inputs validated (DTOs on backend, Zod on frontend)
- **Authentication Guards**: Protected routes require authentication
- **Authorization**: Users can only access their own data (IDOR prevention)
- **Rate Limiting**: All endpoints rate-limited
- **Idempotency**: Payment endpoints use idempotency keys
- **Error Handling**: User-friendly error messages, no stack traces exposed
- **HTTPS**: Required in production
- **CORS**: Properly configured

### Payment-Specific Security
- **Idempotency Keys**: Required for payment initiation
- **Webhook Verification**: Verify webhook signatures
- **Transaction Immutability**: Transaction data immutable once confirmed
- **Payment Link Validation**: Validate expiration, active status, max uses

---

## 📊 API Integration Requirements

### Mansa Transfers API
- **Base URL**: `https://api-stage.mansatransfers.com`
- **API Documentation**: Refer to PDF document for detailed specifications
- **Authentication**: API key/secret (check PDF for authentication method)
- **Endpoints**: Follow API documentation in PDF
- **Error Handling**: Handle API errors gracefully
- **Retry Logic**: Implement retry logic for transient failures
- **Currency**: CFA

### Required API Endpoints (Check PDF for Details)
1. Payment Initiation
2. Payment Status Check
3. Webhook Receipt
4. Any other endpoints specified in the PDF

---

## 📝 Data Models (Summary)

### User
- id, name, email, password (hashed), createdAt, updatedAt

### Product
- id, userId, name, description, price (CFA), createdAt, updatedAt, deletedAt

### PaymentLink
- id, userId, productId (optional), title, description, amount (CFA), slug, isActive, expiresAt, maxUses, currentUses, createdAt, updatedAt, deletedAt

### Transaction
- id, userId, paymentLinkId, externalReference, providerTransactionId, status, provider, customerName, customerPhone, customerEmail, amount (CFA), failureReason, createdAt, updatedAt

### Receipt
- id, transactionId, receiptNumber, pdfUrl (S3), createdAt

---

## ✅ Testing Requirements

### Critical Paths to Test
1. Authentication flow (register, login, password reset)
2. Product creation and management
3. Payment link creation
4. Payment initiation and processing
5. Webhook handling
6. Receipt generation

### Test Types (If Time Permits)
- Unit tests: Services, utilities
- Integration tests: API endpoints
- E2E tests: Critical payment flow

---

## 📚 Documentation Requirements

### README Requirements
- Project overview
- Tech stack used
- How to run locally
- Assumptions made
- Limitations & possible improvements

---

**Note**: For detailed API specifications, refer to the PDF document. This requirements document outlines the core functionality expected based on standard patterns and the assessment context.

