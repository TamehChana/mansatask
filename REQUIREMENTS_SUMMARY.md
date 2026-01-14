# Payment Link Platform - Core Requirements Summary

## Quick Reference - Core Requirements Discussion

Based on the interview assessment PDF, here are the core requirements for each feature area:

---

## 🔐 1. Authentication & User Management

### Core Requirements:

**Backend:**
- User registration (email, password, name)
- User login (email, password) → JWT tokens
- Password reset (forgot password, reset password)
- Token refresh mechanism
- JWT authentication guards
- User profile management (get/update)

**Frontend:**
- Login page
- Registration page
- Forgot password page
- Reset password page
- User profile page
- Auth state management (Zustand)
- Protected routes

**Security:**
- Password hashing (bcrypt)
- JWT tokens (access + refresh)
- Rate limiting
- Input validation
- Authorization (users can only access their own data)

---

## 📦 2. Product & Payment Link Creation

### Core Requirements:

**Product Management:**
- Create, Read, Update, Delete products
- Product fields: name, description, price (CFA)
- User ownership (merchants can only manage their own products)
- Product listing with filters

**Payment Link Management:**
- Create payment links (with or without product)
- Payment link fields:
  - Title, description, amount (CFA)
  - Optional: Link to existing product
  - Optional: Expiration (days or date)
  - Optional: Max uses
- Generate unique slug for payment links
- QR code generation for payment links
- List, view, update, delete payment links
- Public endpoint to get payment link by slug (no auth)

**Frontend:**
- Product list, create, edit pages
- Payment link list, create, edit pages
- Payment link details page (with QR code, share options)
- Form validation
- Currency display (CFA)

---

## 🌐 3. Public Payment Page (Client Side)

### Core Requirements:

**Backend:**
- Public endpoint: `GET /payment-links/public/:slug`
- No authentication required
- Validate: Link exists, active, not expired, not max uses reached
- Return: Payment link data for display

**Frontend:**
- Public page: `/pay/[slug]`
- **No authentication required**
- Display:
  - Merchant/business info
  - Product/service info
  - Amount (prominent, in CFA)
- Payment form:
  - Customer name (required)
  - Customer email (optional)
  - Customer phone (required)
  - Payment provider selection (MTN, Vodafone, AirtelTigo)
  - Additional notes (optional)
- "Pay Now" button
- Security/trust indicators
- Form validation
- Error handling (expired links, etc.)
- Mobile-optimized

---

## 💳 4. Payment Flow (Mobile Money)

### Core Requirements:

**API Integration:**
- **Payment Provider**: Mansa Transfers API
- **Base URL**: `https://api-stage.mansatransfers.com`
- **API Documentation**: Detailed specs in the PDF document
- **Currency**: CFA
- **Providers**: MTN, Vodafone, AirtelTigo

**Backend - Payment Initiation:**
- Endpoint: `POST /payments/initiate`
- **Public** (no auth, but validate payment link)
- **Idempotency**: Required (use idempotency key header)
- Fields:
  - paymentLinkId/slug
  - customerName, customerPhone, customerEmail
  - paymentProvider (MTN, VODAFONE, AIRTELTIGO)
  - idempotencyKey (header)
- Process:
  1. Check idempotency key (Redis)
  2. Validate payment link
  3. Create transaction (PENDING)
  4. Call Mansa Transfers API (follow PDF docs)
  5. Store provider transaction ID
  6. Return transaction reference
- Error handling & retry logic

**Backend - Payment Status:**
- Endpoint: `GET /payments/status/:externalReference`
- Public (no auth)
- Return transaction status
- Statuses: PENDING, PROCESSING, SUCCESS, FAILED

**Backend - Webhooks:**
- Endpoint: `POST /webhooks/payment`
- Public (but verify signature)
- Process:
  - Verify signature
  - Check for duplicates
  - Update transaction status
  - Trigger notifications
  - Generate receipt (on success)

**Frontend - Payment Flow:**
1. **Public Payment Page** → Collect customer details
2. **Payment Initiation** → Submit payment, get transaction reference
3. **Payment Status Page** → Display status, poll for updates
4. **Success/Failed** → Show result, download receipt (if successful)

**Status Handling:**
- PENDING: Show waiting message, poll status
- PROCESSING: Show processing message, poll status
- SUCCESS: Show success, download receipt button
- FAILED: Show error, retry button

---

## 🧾 5. Receipt Generation & Download

### Core Requirements:

**Backend - Receipt Generation:**
- Generate PDF receipts (PDFKit)
- Receipt number format: `RCP-2024-001234`
- Store PDFs in AWS S3
- Receipt content:
  - Receipt number
  - Date/time
  - Amount (CFA)
  - Customer info
  - Merchant info
  - Payment method
  - Transaction reference
  - QR code (optional)
- Auto-generate on payment success
- Endpoints:
  - `GET /receipts/:transactionId` (get receipt info)
  - `GET /receipts/:transactionId/download` (download PDF)

**Frontend - Receipt:**
- Receipt display page
- Download PDF button
- Print option (optional)
- Share receipt (optional)

---

## 💰 Currency: CFA

**Important**: Currency is **CFA** (West African CFA Franc), not GHS.

- **Symbol**: CFA or XOF
- **Display**: "1,000 CFA" or "1 000 CFA"
- **Input**: Accept decimal values (e.g., 1000.50)
- **Storage**: Decimal type (precision: 2 decimal places)
- **Formatting**: All amounts displayed in CFA

---

## 📚 API Documentation Reference

**Important**: The detailed API documentation for Mansa Transfers API is in the PDF document. Refer to the PDF for:
- Authentication method (API key/secret)
- Request/response formats
- Error codes
- Webhook payload structure
- Signature verification
- Any specific requirements

**Base URL**: `https://api-stage.mansatransfers.com`

---

## ✅ Implementation Checklist

### Authentication & User Management
- [ ] User registration
- [ ] User login
- [ ] Password reset
- [ ] JWT tokens
- [ ] Protected routes
- [ ] User profile

### Product & Payment Link
- [ ] Product CRUD
- [ ] Payment link CRUD
- [ ] QR code generation for payment links ✅ **REQUIRED**
- [ ] Expirable payment links ✅ **REQUIRED**
- [ ] Expiration handling
- [ ] Max uses tracking

### Public Payment Page
- [ ] Public payment page (no auth)
- [ ] Payment form
- [ ] Form validation
- [ ] Link validation

### Payment Flow
- [ ] Payment initiation (with idempotency)
- [ ] Mansa Transfers API integration (follow PDF)
- [ ] Payment status checking
- [ ] Webhook handling ✅ **REQUIRED**
- [ ] Webhook simulation for payment success ✅ **REQUIRED**
- [ ] Status polling
- [ ] Error handling

### Email Notifications
- [ ] Email notification after successful payment ✅ **REQUIRED**
- [ ] Email service setup (Nodemailer)
- [ ] Email templates (Handlebars)
- [ ] Email queue (Bull)

### Dashboard & Analytics
- [ ] Admin dashboard metrics ✅ **REQUIRED**
  - [ ] Total sales
  - [ ] Number of payments
  - [ ] Additional metrics (optional)
- [ ] Dashboard UI
- [ ] Statistics aggregation

### Receipt Generation
- [ ] PDF generation
- [ ] AWS S3 upload
- [ ] Receipt download
- [ ] Auto-generation on success

### Testing
- [ ] Unit tests ✅ **REQUIRED**
- [ ] Integration tests ✅ **REQUIRED**
- [ ] E2E tests (optional)

### Infrastructure
- [ ] Docker setup ✅ **REQUIRED**
- [ ] Docker Compose
- [ ] Dockerfiles (backend & frontend)

---

## 🎯 Key Points to Remember

1. **Currency**: CFA (not GHS)
2. **API Docs**: Refer to PDF for Mansa Transfers API details
3. **Idempotency**: Required for payment endpoints
4. **Public Pages**: Payment page and status page are public (no auth)
5. **Security**: All endpoints need validation, authorization, rate limiting
6. **Mobile Money**: MTN, Vodafone, AirtelTigo
7. **Receipts**: Server-side PDF generation, stored in AWS S3

---

**For detailed requirements, see**: `CORE_REQUIREMENTS.md`

