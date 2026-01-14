# Testing Authentication Endpoints

## 🚀 Quick Start Guide

### Step 1: Start the Backend

Make sure PostgreSQL and Redis are running:

```powershell
cd E:\MANSATASK
docker compose ps
```

If they're not running:
```powershell
docker compose up -d postgres redis
```

Then start the backend:
```powershell
cd E:\MANSATASK\backend
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/mansatask_db?schema=public"
npm run start:dev
```

The backend should start at: `http://localhost:3000/api`

---

## 🧪 Testing Methods

### Option 1: Using Postman (Recommended)

1. **Download Postman** (if you don't have it): https://www.postman.com/downloads/

2. **Create a new collection**: "Payment Link Platform - Auth"

3. **Test endpoints** (see examples below)

---

### Option 2: Using curl (Command Line)

Open PowerShell or Command Prompt and use the commands below.

---

### Option 3: Using HTTP Client (VS Code Extension)

1. Install **REST Client** extension in VS Code
2. Create a `.http` file
3. Use the examples below

---

## 📋 Test Scenarios

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Using curl**:
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}'
```

**Expected Response** (200 OK):
```json
{
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "MERCHANT",
    "createdAt": "2024-01-11T12:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the tokens** - you'll need them for protected endpoints!

---

### 2. User Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Using curl**:
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"john@example.com\",\"password\":\"password123\"}'
```

**Expected Response** (200 OK):
```json
{
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "MERCHANT"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Get User Profile (Protected)

**Endpoint**: `GET /api/users/profile`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Using curl**:
```powershell
# Replace YOUR_ACCESS_TOKEN_HERE with the token from login/register
curl -X GET http://localhost:3000/api/users/profile `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "MERCHANT",
  "createdAt": "2024-01-11T12:00:00.000Z",
  "updatedAt": "2024-01-11T12:00:00.000Z"
}
```

**Without Token** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### 4. Update User Profile (Protected)

**Endpoint**: `PUT /api/users/profile`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Using curl**:
```powershell
curl -X PUT http://localhost:3000/api/users/profile `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"John Updated\",\"email\":\"john.updated@example.com\"}'
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "MERCHANT",
  "createdAt": "2024-01-11T12:00:00.000Z",
  "updatedAt": "2024-01-11T12:05:00.000Z"
}
```

---

### 5. Refresh Access Token

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

**Using curl**:
```powershell
# Replace YOUR_REFRESH_TOKEN_HERE with the refresh token from login/register
curl -X POST http://localhost:3000/api/auth/refresh `
  -H "Content-Type: application/json" `
  -d '{\"refreshToken\":\"YOUR_REFRESH_TOKEN_HERE\"}'
```

**Expected Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 6. Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Using curl**:
```powershell
curl -X POST http://localhost:3000/api/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"john@example.com\"}'
```

**Expected Response** (200 OK):
```json
{
  "message": "If a user with that email exists, a password reset link has been sent.",
  "resetToken": "token-here"  // Only in development mode
}
```

**Note**: In development mode, the reset token is returned in the response. Check the backend console logs for the token.

---

### 7. Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "token": "RESET_TOKEN_FROM_FORGOT_PASSWORD",
  "password": "newpassword123"
}
```

**Using curl**:
```powershell
curl -X POST http://localhost:3000/api/auth/reset-password `
  -H "Content-Type: application/json" `
  -d '{\"token\":\"RESET_TOKEN_FROM_FORGOT_PASSWORD\",\"password\":\"newpassword123\"}'
```

**Expected Response** (200 OK):
```json
{
  "message": "Password has been reset successfully"
}
```

---

## ✅ Error Testing

### Test Invalid Credentials (Login)

**Request**:
```json
{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}
```

**Expected Response** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid email or password"
}
```

---

### Test Duplicate Registration

**Request** (register same email twice):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

---

### Test Validation Errors

**Request** (missing fields):
```json
{
  "email": "invalid-email"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "email must be an email", "password should not be empty"],
  "error": "Bad Request"
}
```

---

## 📝 Complete Test Flow

1. **Register a new user** → Get accessToken and refreshToken
2. **Get profile** → Use accessToken to verify authentication works
3. **Update profile** → Use accessToken to update user info
4. **Refresh token** → Use refreshToken to get new accessToken
5. **Login again** → Verify you can login with credentials
6. **Forgot password** → Request password reset
7. **Reset password** → Use reset token to change password
8. **Login with new password** → Verify password reset worked

---

## 🔧 Quick Test Script

Save this as `test-auth.ps1` in the project root:

```powershell
# Test Authentication Endpoints
$baseUrl = "http://localhost:3000/api"

# 1. Register
Write-Host "1. Testing Registration..." -ForegroundColor Cyan
$registerBody = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
Write-Host "Registration successful!" -ForegroundColor Green
$accessToken = $registerResponse.accessToken
$refreshToken = $registerResponse.refreshToken

# 2. Get Profile
Write-Host "`n2. Testing Get Profile..." -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $accessToken"
}
$profileResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers
Write-Host "Profile retrieved: $($profileResponse.name)" -ForegroundColor Green

# 3. Update Profile
Write-Host "`n3. Testing Update Profile..." -ForegroundColor Cyan
$updateBody = @{
    name = "Test User Updated"
} | ConvertTo-Json
$updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method PUT -Body $updateBody -Headers $headers -ContentType "application/json"
Write-Host "Profile updated: $($updateResponse.name)" -ForegroundColor Green

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

Run it with:
```powershell
.\test-auth.ps1
```

---

## 🐛 Troubleshooting

### Backend not starting?
- Check if PostgreSQL is running: `docker compose ps`
- Check if DATABASE_URL is correct in .env
- Check backend logs for errors

### 401 Unauthorized?
- Make sure you're including the `Authorization: Bearer TOKEN` header
- Token might be expired (try refreshing)
- Check token format (should start with `eyJ...`)

### 400 Bad Request?
- Check request body format (must be valid JSON)
- Check required fields (name, email, password)
- Check validation errors in response

### Connection refused?
- Make sure backend is running on port 3000
- Check if another service is using port 3000

---

## 🔍 Products Endpoints Testing

### Prerequisites

Before testing products endpoints, you need to:
1. Be authenticated (have a valid access token)
2. Use the token from login/register in the Authorization header

---

### 8. Create Product (Protected)

**Endpoint**: `POST /api/products`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Premium Product",
  "description": "A high-quality product for testing",
  "price": 99.99
}
```

**Using curl**:
```powershell
curl -X POST http://localhost:3000/api/products `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Premium Product\",\"description\":\"A high-quality product for testing\",\"price\":99.99}'
```

**Expected Response** (201 Created):
```json
{
  "id": "uuid-here",
  "name": "Premium Product",
  "description": "A high-quality product for testing",
  "price": 99.99,
  "userId": "user-uuid-here",
  "createdAt": "2024-01-11T12:00:00.000Z",
  "updatedAt": "2024-01-11T12:00:00.000Z"
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "price must be a number", "price must be greater than 0"],
  "error": "Bad Request"
}
```

---

### 9. List All Products (Protected)

**Endpoint**: `GET /api/products`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Using curl**:
```powershell
curl -X GET http://localhost:3000/api/products `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
[
  {
    "id": "uuid-here",
    "name": "Premium Product",
    "description": "A high-quality product for testing",
    "price": 99.99,
    "userId": "user-uuid-here",
    "createdAt": "2024-01-11T12:00:00.000Z",
    "updatedAt": "2024-01-11T12:00:00.000Z"
  }
]
```

**Note**: Only returns products created by the authenticated user.

---

### 10. Get Single Product (Protected)

**Endpoint**: `GET /api/products/:id`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Using curl**:
```powershell
# Replace PRODUCT_ID with the actual product ID
curl -X GET http://localhost:3000/api/products/PRODUCT_ID `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "name": "Premium Product",
  "description": "A high-quality product for testing",
  "price": 99.99,
  "userId": "user-uuid-here",
  "createdAt": "2024-01-11T12:00:00.000Z",
  "updatedAt": "2024-01-11T12:00:00.000Z"
}
```

**Product Not Found** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

**Unauthorized Access** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "You don't have access to this product"
}
```

---

### 11. Update Product (Protected)

**Endpoint**: `PATCH /api/products/:id`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 149.99
}
```

**Using curl**:
```powershell
# Replace PRODUCT_ID with the actual product ID
curl -X PATCH http://localhost:3000/api/products/PRODUCT_ID `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Updated Product Name\",\"price\":149.99}'
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 149.99,
  "userId": "user-uuid-here",
  "createdAt": "2024-01-11T12:00:00.000Z",
  "updatedAt": "2024-01-11T12:05:00.000Z"
}
```

---

### 12. Delete Product (Protected)

**Endpoint**: `DELETE /api/products/:id`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Using curl**:
```powershell
# Replace PRODUCT_ID with the actual product ID
curl -X DELETE http://localhost:3000/api/products/PRODUCT_ID `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "message": "Product deleted successfully"
}
```

**Note**: Products are soft-deleted (not permanently removed from database).

---

## 🏥 Health Check Endpoint

### 13. Health Check (Public)

**Endpoint**: `GET /api/health`

**Using curl**:
```powershell
curl -X GET http://localhost:3000/api/health
```

**Expected Response - Healthy** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-11T12:00:00.000Z",
  "database": "connected"
}
```

**Expected Response - Unhealthy** (200 OK with error status):
```json
{
  "status": "error",
  "timestamp": "2024-01-11T12:00:00.000Z",
  "database": "disconnected",
  "error": "Connection error message"
}
```

**Note**: This endpoint doesn't require authentication. Use it to verify the backend is running and database is connected.

---

## 🔄 Complete Products Test Flow

1. **Login/Register** → Get access token
2. **Create product** → Get product ID
3. **List products** → Verify product appears in list
4. **Get single product** → Use product ID to retrieve details
5. **Update product** → Modify product details
6. **Get updated product** → Verify changes were saved
7. **Delete product** → Remove product (soft delete)
8. **List products again** → Verify product is no longer in list

---

## 📋 Quick Products Test Script

Save this as `test-products.ps1` in the project root:

```powershell
# Test Products Endpoints
$baseUrl = "http://localhost:3000/api"

# First, login to get access token
Write-Host "1. Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $accessToken = $loginResponse.accessToken
    Write-Host "Login successful!" -ForegroundColor Green
} catch {
    Write-Host "Login failed. Please register first or check credentials." -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $accessToken"
}

# 2. Create Product
Write-Host "`n2. Creating product..." -ForegroundColor Cyan
$createBody = @{
    name = "Test Product"
    description = "Product for testing"
    price = 99.99
} | ConvertTo-Json

$createResponse = Invoke-RestMethod -Uri "$baseUrl/products" -Method POST -Body $createBody -Headers $headers -ContentType "application/json"
Write-Host "Product created: $($createResponse.name) (ID: $($createResponse.id))" -ForegroundColor Green
$productId = $createResponse.id

# 3. List Products
Write-Host "`n3. Listing products..." -ForegroundColor Cyan
$listResponse = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET -Headers $headers
Write-Host "Found $($listResponse.Count) product(s)" -ForegroundColor Green

# 4. Get Single Product
Write-Host "`n4. Getting product details..." -ForegroundColor Cyan
$getResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method GET -Headers $headers
Write-Host "Product: $($getResponse.name) - Price: $($getResponse.price)" -ForegroundColor Green

# 5. Update Product
Write-Host "`n5. Updating product..." -ForegroundColor Cyan
$updateBody = @{
    name = "Updated Test Product"
    price = 149.99
} | ConvertTo-Json
$updateResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method PATCH -Body $updateBody -Headers $headers -ContentType "application/json"
Write-Host "Product updated: $($updateResponse.name) - New Price: $($updateResponse.price)" -ForegroundColor Green

# 6. Delete Product
Write-Host "`n6. Deleting product..." -ForegroundColor Cyan
$deleteResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method DELETE -Headers $headers
Write-Host "Product deleted successfully" -ForegroundColor Green

Write-Host "`n✅ All product tests passed!" -ForegroundColor Green
```

Run it with:
```powershell
.\test-products.ps1
```

---

## 🚧 Upcoming Endpoints

The following endpoints are planned but not yet implemented:

### Payment Endpoints
- `POST /api/payments/initiate` - Initiate payment (public, requires idempotency key)
- `GET /api/payments/status/:externalReference` - Check payment status (public)
- `POST /api/webhooks/payment` - Payment webhook handler (public, requires signature verification)

### Transaction Endpoints
- `GET /api/transactions` - List transactions (protected)
- `GET /api/transactions/:id` - Get transaction details (protected)

---

## 🔗 Payment Links Endpoints Testing

### Prerequisites

Before testing payment links endpoints, you need to:
1. Be authenticated (have a valid access token)
2. Use the token from login/register in the Authorization header

---

### 14. Create Payment Link (Protected)

**Endpoint**: `POST /api/payment-links`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Premium Service Payment",
  "description": "Payment link for premium service subscription",
  "amount": 1500.50,
  "productId": "optional-product-uuid",
  "expiresAfterDays": 30,
  "maxUses": 10,
  "isActive": true
}
```

**Using curl**:
```powershell
curl -X POST http://localhost:3000/api/payment-links `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Premium Service Payment\",\"description\":\"Payment link for premium service subscription\",\"amount\":1500.50,\"expiresAfterDays\":30,\"maxUses\":10,\"isActive\":true}'
```

**Expected Response** (201 Created):
```json
{
  "id": "uuid-here",
  "userId": "user-uuid-here",
  "productId": "optional-product-uuid",
  "title": "Premium Service Payment",
  "description": "Payment link for premium service subscription",
  "amount": 1500.50,
  "slug": "pay-abc123xyz",
  "isActive": true,
  "expiresAt": "2024-02-10T12:00:00.000Z",
  "expiresAfterDays": 30,
  "maxUses": 10,
  "currentUses": 0,
  "createdAt": "2024-01-11T12:00:00.000Z",
  "updatedAt": "2024-01-11T12:00:00.000Z",
  "product": null
}
```

**Note**: The slug is automatically generated in the format `pay-{randomString}` (e.g., `pay-abc123xyz`).

---

### 15. List Payment Links (Protected)

**Endpoint**: `GET /api/payment-links`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Using curl**:
```powershell
curl -X GET http://localhost:3000/api/payment-links `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
[
  {
    "id": "uuid-here",
    "title": "Premium Service Payment",
    "slug": "pay-abc123xyz",
    "amount": 1500.50,
    "isActive": true,
    "expiresAt": "2024-02-10T12:00:00.000Z",
    "currentUses": 0,
    "maxUses": 10,
    "product": null
  }
]
```

**Note**: Only returns payment links created by the authenticated user.

---

### 16. Get Single Payment Link (Protected)

**Endpoint**: `GET /api/payment-links/:id`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Using curl**:
```powershell
# Replace PAYMENT_LINK_ID with the actual payment link ID
curl -X GET http://localhost:3000/api/payment-links/PAYMENT_LINK_ID `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "title": "Premium Service Payment",
  "slug": "pay-abc123xyz",
  "amount": 1500.50,
  "isActive": true,
  "expiresAt": "2024-02-10T12:00:00.000Z",
  "maxUses": 10,
  "currentUses": 0,
  "product": null
}
```

**Payment Link Not Found** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Payment link not found"
}
```

**Unauthorized Access** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "You do not have access to this payment link"
}
```

---

### 17. Get Public Payment Link (by slug - No Auth Required)

**Endpoint**: `GET /api/payment-links/public/:slug`

**Note**: This endpoint does NOT require authentication. It's for public access to payment links.

**Using curl**:
```powershell
# Replace SLUG with the payment link slug (e.g., pay-abc123xyz)
curl -X GET http://localhost:3000/api/payment-links/public/pay-abc123xyz
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "title": "Premium Service Payment",
  "description": "Payment link for premium service subscription",
  "amount": 1500.50,
  "slug": "pay-abc123xyz",
  "isActive": true,
  "expiresAt": "2024-02-10T12:00:00.000Z",
  "maxUses": 10,
  "currentUses": 0,
  "product": {
    "id": "product-uuid",
    "name": "Premium Service",
    "description": "Service description"
  },
  "user": {
    "id": "user-uuid",
    "name": "Merchant Name",
    "email": "merchant@example.com"
  }
}
```

**Link Not Found** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Payment link not found"
}
```

**Link Inactive/Expired/Max Uses** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Payment link is not active"
}
```
or
```json
{
  "statusCode": 400,
  "message": "Payment link has expired"
}
```
or
```json
{
  "statusCode": 400,
  "message": "Payment link has reached maximum number of uses"
}
```

---

### 18. Update Payment Link (Protected)

**Endpoint**: `PATCH /api/payment-links/:id`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated Payment Link Title",
  "description": "Updated description",
  "amount": 2000.00,
  "isActive": false,
  "expiresAfterDays": 60,
  "maxUses": 20
}
```

**Using curl**:
```powershell
# Replace PAYMENT_LINK_ID with the actual payment link ID
curl -X PATCH http://localhost:3000/api/payment-links/PAYMENT_LINK_ID `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"Updated Payment Link Title\",\"amount\":2000.00}'
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "title": "Updated Payment Link Title",
  "amount": 2000.00,
  "slug": "pay-abc123xyz",
  "isActive": false,
  "updatedAt": "2024-01-11T12:05:00.000Z"
}
```

**Note**: The slug cannot be updated (it's generated once and remains constant).

---

### 19. Delete Payment Link (Protected)

**Endpoint**: `DELETE /api/payment-links/:id`

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Using curl**:
```powershell
# Replace PAYMENT_LINK_ID with the actual payment link ID
curl -X DELETE http://localhost:3000/api/payment-links/PAYMENT_LINK_ID `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response** (200 OK):
```json
{
  "message": "Payment link deleted successfully"
}
```

**Note**: Payment links are soft-deleted (not permanently removed from database). Deleted links are also automatically deactivated.

---

## 📋 Complete Payment Links Test Flow

1. **Login/Register** → Get access token
2. **Create payment link** → Get payment link ID and slug
3. **List payment links** → Verify link appears in list
4. **Get single payment link** → Use ID to retrieve details
5. **Get public payment link** → Use slug to retrieve public details (no auth)
6. **Update payment link** → Modify payment link details
7. **Get updated payment link** → Verify changes were saved
8. **Delete payment link** → Remove payment link (soft delete)
9. **Verify public link fails** → Confirm deleted link is no longer accessible publicly

---

## 🔧 Quick Payment Links Test Script

Save this as `test-payment-links.ps1` in the project root:

```powershell
# Test Payment Links Endpoints
$baseUrl = "http://localhost:3000/api"

# First, login to get access token
Write-Host "Logging in..." -ForegroundColor Cyan
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$accessToken = $loginResponse.accessToken
$headers = @{
    Authorization = "Bearer $accessToken"
}

# Create Payment Link
Write-Host "`nCreating payment link..." -ForegroundColor Cyan
$createBody = @{
    title = "Test Payment Link"
    description = "Test description"
    amount = 1500.50
    expiresAfterDays = 30
    maxUses = 10
} | ConvertTo-Json

$createResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links" -Method POST -Body $createBody -Headers $headers -ContentType "application/json"
Write-Host "Payment link created: $($createResponse.title) (Slug: $($createResponse.slug))" -ForegroundColor Green
$paymentLinkId = $createResponse.id
$paymentLinkSlug = $createResponse.slug

# List Payment Links
Write-Host "`nListing payment links..." -ForegroundColor Cyan
$listResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links" -Method GET -Headers $headers
Write-Host "Found $($listResponse.Count) payment link(s)" -ForegroundColor Green

# Get Public Payment Link
Write-Host "`nGetting public payment link..." -ForegroundColor Cyan
$publicResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/public/$paymentLinkSlug" -Method GET
Write-Host "Public link: $($publicResponse.title) - Amount: $($publicResponse.amount)" -ForegroundColor Green

# Update Payment Link
Write-Host "`nUpdating payment link..." -ForegroundColor Cyan
$updateBody = @{
    title = "Updated Payment Link"
    amount = 2000.00
} | ConvertTo-Json
$updateResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/$paymentLinkId" -Method PATCH -Body $updateBody -Headers $headers -ContentType "application/json"
Write-Host "Payment link updated: $($updateResponse.title) - New Amount: $($updateResponse.amount)" -ForegroundColor Green

# Delete Payment Link
Write-Host "`nDeleting payment link..." -ForegroundColor Cyan
$deleteResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/$paymentLinkId" -Method DELETE -Headers $headers
Write-Host "Payment link deleted successfully" -ForegroundColor Green

Write-Host "`n[SUCCESS] All payment links tests passed!" -ForegroundColor Green
```

Run it with:
```powershell
.\test-payment-links.ps1
```

---

**Ready to test? Start the backend and try the endpoints!** 🚀

