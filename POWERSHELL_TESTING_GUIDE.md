# PowerShell Testing Guide - Authentication Endpoints

## 🚀 Step-by-Step Testing Instructions

### Prerequisites

1. **Backend must be running** on `http://localhost:3000`
2. **PostgreSQL must be running** (Docker)
3. **PowerShell** (Windows PowerShell or PowerShell Core)

---

## 📋 Method 1: Automated Test Script (Easiest)

### Step 1: Start the Backend (if not running)

Open **PowerShell Terminal 1**:

```powershell
cd E:\MANSATASK\backend

# Set database URL
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/mansatask_db?schema=public"

# Start the backend
npm run start:dev
```

**Wait until you see:**
```
🚀 Application is running on: http://localhost:3000/api
```

---

### Step 2: Run the Test Script

Open **PowerShell Terminal 2** (new window):

```powershell
cd E:\MANSATASK

# Run the test script
.\test-auth.ps1
```

**The script will automatically:**
- ✅ Register a new user
- ✅ Get user profile (protected endpoint)
- ✅ Update user profile (protected endpoint)
- ✅ Login
- ✅ Refresh token

**Expected Output:**
```
🧪 Testing Authentication Endpoints
====================================

1. Testing Registration...
✅ Registration successful!
   User: Test User (test@example.com)
   Access Token: eyJhbGciOiJIUzI1NiIs...

2. Testing Get Profile (Protected)...
✅ Profile retrieved successfully!
   Name: Test User
   Email: test@example.com
   Role: MERCHANT

3. Testing Update Profile (Protected)...
✅ Profile updated successfully!
   New Name: Test User Updated

4. Testing Login...
✅ Login successful!
   User: Test User Updated

5. Testing Refresh Token...
✅ Token refreshed successfully!
   New Access Token: eyJhbGciOiJIUzI1NiIs...

====================================
✅ All tests completed!
```

---

## 📋 Method 2: Manual PowerShell Commands (Step-by-Step)

### Step 1: Start the Backend

Open **PowerShell Terminal 1**:

```powershell
cd E:\MANSATASK\backend
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/mansatask_db?schema=public"
npm run start:dev
```

**Wait until you see:**
```
🚀 Application is running on: http://localhost:3000/api
```

---

### Step 2: Test Registration (POST /api/auth/register)

Open **PowerShell Terminal 2** (new window):

```powershell
# Set base URL
$baseUrl = "http://localhost:3000/api"

# Prepare request body
$registerBody = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

# Send POST request
$response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"

# Display response
Write-Host "✅ Registration Successful!" -ForegroundColor Green
Write-Host "User: $($response.user.name)" -ForegroundColor Cyan
Write-Host "Email: $($response.user.email)" -ForegroundColor Cyan
Write-Host "Access Token: $($response.accessToken.Substring(0, 30))..." -ForegroundColor Gray

# Save tokens for next steps
$accessToken = $response.accessToken
$refreshToken = $response.refreshToken
```

**Expected Output:**
```
✅ Registration Successful!
User: John Doe
Email: john@example.com
Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 3: Test Get Profile (GET /api/users/profile)

**Continue in the same PowerShell window:**

```powershell
# Prepare headers with access token
$headers = @{
    Authorization = "Bearer $accessToken"
}

# Send GET request
$profileResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers

# Display response
Write-Host "`n✅ Profile Retrieved!" -ForegroundColor Green
Write-Host "ID: $($profileResponse.id)" -ForegroundColor Cyan
Write-Host "Name: $($profileResponse.name)" -ForegroundColor Cyan
Write-Host "Email: $($profileResponse.email)" -ForegroundColor Cyan
Write-Host "Role: $($profileResponse.role)" -ForegroundColor Cyan
```

**Expected Output:**
```
✅ Profile Retrieved!
ID: 123e4567-e89b-12d3-a456-426614174000
Name: John Doe
Email: john@example.com
Role: MERCHANT
```

---

### Step 4: Test Update Profile (PUT /api/users/profile)

**Continue in the same PowerShell window:**

```powershell
# Prepare request body
$updateBody = @{
    name = "John Updated"
    email = "john.updated@example.com"
} | ConvertTo-Json

# Send PUT request
$updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method PUT -Body $updateBody -Headers $headers -ContentType "application/json"

# Display response
Write-Host "`n✅ Profile Updated!" -ForegroundColor Green
Write-Host "Name: $($updateResponse.name)" -ForegroundColor Cyan
Write-Host "Email: $($updateResponse.email)" -ForegroundColor Cyan
```

**Expected Output:**
```
✅ Profile Updated!
Name: John Updated
Email: john.updated@example.com
```

---

### Step 5: Test Login (POST /api/auth/login)

**Continue in the same PowerShell window:**

```powershell
# Prepare request body (use original email or updated email)
$loginBody = @{
    email = "john.updated@example.com"
    password = "password123"
} | ConvertTo-Json

# Send POST request
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

# Display response
Write-Host "`n✅ Login Successful!" -ForegroundColor Green
Write-Host "User: $($loginResponse.user.name)" -ForegroundColor Cyan
Write-Host "Email: $($loginResponse.user.email)" -ForegroundColor Cyan

# Update tokens
$accessToken = $loginResponse.accessToken
$refreshToken = $loginResponse.refreshToken
$headers = @{
    Authorization = "Bearer $accessToken"
}
```

**Expected Output:**
```
✅ Login Successful!
User: John Updated
Email: john.updated@example.com
```

---

### Step 6: Test Refresh Token (POST /api/auth/refresh)

**Continue in the same PowerShell window:**

```powershell
# Prepare request body
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

# Send POST request
$refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"

# Display response
Write-Host "`n✅ Token Refreshed!" -ForegroundColor Green
Write-Host "New Access Token: $($refreshResponse.accessToken.Substring(0, 30))..." -ForegroundColor Cyan

# Update access token
$accessToken = $refreshResponse.accessToken
$headers = @{
    Authorization = "Bearer $accessToken"
}
```

**Expected Output:**
```
✅ Token Refreshed!
New Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 7: Test Forgot Password (POST /api/auth/forgot-password)

**Continue in the same PowerShell window:**

```powershell
# Prepare request body
$forgotBody = @{
    email = "john.updated@example.com"
} | ConvertTo-Json

# Send POST request
$forgotResponse = Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" -Method POST -Body $forgotBody -ContentType "application/json"

# Display response
Write-Host "`n✅ Forgot Password Request Sent!" -ForegroundColor Green
Write-Host "Message: $($forgotResponse.message)" -ForegroundColor Cyan

# In development mode, reset token is returned
if ($forgotResponse.resetToken) {
    Write-Host "Reset Token: $($forgotResponse.resetToken)" -ForegroundColor Yellow
    $resetToken = $forgotResponse.resetToken
}
```

**Expected Output:**
```
✅ Forgot Password Request Sent!
Message: If a user with that email exists, a password reset link has been sent.
Reset Token: abc123def456...
```

---

### Step 8: Test Reset Password (POST /api/auth/reset-password)

**Continue in the same PowerShell window (use token from Step 7):**

```powershell
# Prepare request body (use reset token from Step 7)
$resetBody = @{
    token = $resetToken  # From Step 7
    password = "newpassword123"
} | ConvertTo-Json

# Send POST request
$resetResponse = Invoke-RestMethod -Uri "$baseUrl/auth/reset-password" -Method POST -Body $resetBody -ContentType "application/json"

# Display response
Write-Host "`n✅ Password Reset Successful!" -ForegroundColor Green
Write-Host "Message: $($resetResponse.message)" -ForegroundColor Cyan
```

**Expected Output:**
```
✅ Password Reset Successful!
Message: Password has been reset successfully
```

---

### Step 9: Test Login with New Password

**Continue in the same PowerShell window:**

```powershell
# Prepare request body with new password
$loginBody = @{
    email = "john.updated@example.com"
    password = "newpassword123"
} | ConvertTo-Json

# Send POST request
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

# Display response
Write-Host "`n✅ Login with New Password Successful!" -ForegroundColor Green
Write-Host "User: $($loginResponse.user.name)" -ForegroundColor Cyan
```

**Expected Output:**
```
✅ Login with New Password Successful!
User: John Updated
```

---

## 🐛 Testing Error Cases

### Test Invalid Login (Wrong Password)

```powershell
$baseUrl = "http://localhost:3000/api"

$loginBody = @{
    email = "john.updated@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
} catch {
    Write-Host "❌ Error (Expected): $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
    Write-Host "Message: $($responseBody.message)" -ForegroundColor Yellow
}
```

**Expected Output:**
```
❌ Error (Expected): 401
Message: Invalid email or password
```

---

### Test Protected Endpoint Without Token

```powershell
$baseUrl = "http://localhost:3000/api"

try {
    Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET
} catch {
    Write-Host "❌ Error (Expected): $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
    Write-Host "Message: $($responseBody.message)" -ForegroundColor Yellow
}
```

**Expected Output:**
```
❌ Error (Expected): 401
Message: Unauthorized
```

---

### Test Duplicate Registration

```powershell
$baseUrl = "http://localhost:3000/api"

$registerBody = @{
    name = "Duplicate User"
    email = "john.updated@example.com"  # Same email as before
    password = "password123"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
} catch {
    Write-Host "❌ Error (Expected): $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
    Write-Host "Message: $($responseBody.message)" -ForegroundColor Yellow
}
```

**Expected Output:**
```
❌ Error (Expected): 409
Message: User with this email already exists
```

---

## 📝 Complete PowerShell Test Script

Here's a complete script you can copy-paste into PowerShell:

```powershell
# Complete Authentication Test Script
$baseUrl = "http://localhost:3000/api"

Write-Host "🧪 Testing Authentication Endpoints" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 1. Register
Write-Host "`n1. Testing Registration..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    $accessToken = $registerResponse.accessToken
    $refreshToken = $registerResponse.refreshToken
    $headers = @{ Authorization = "Bearer $accessToken" }
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Get Profile
Write-Host "`n2. Testing Get Profile..." -ForegroundColor Yellow
try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers
    Write-Host "✅ Profile retrieved: $($profileResponse.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Get profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Update Profile
Write-Host "`n3. Testing Update Profile..." -ForegroundColor Yellow
$updateBody = @{ name = "Test User Updated" } | ConvertTo-Json
try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method PUT -Body $updateBody -Headers $headers -ContentType "application/json"
    Write-Host "✅ Profile updated: $($updateResponse.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Update profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Login
Write-Host "`n4. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful: $($loginResponse.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Refresh Token
Write-Host "`n5. Testing Refresh Token..." -ForegroundColor Yellow
$refreshBody = @{ refreshToken = $refreshToken } | ConvertTo-Json
try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
    Write-Host "✅ Token refreshed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Refresh token failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "✅ All tests completed!" -ForegroundColor Green
```

---

## ✅ Quick Reference

### Common PowerShell Commands

```powershell
# Set base URL
$baseUrl = "http://localhost:3000/api"

# Create JSON body
$body = @{ key = "value" } | ConvertTo-Json

# Set headers
$headers = @{ Authorization = "Bearer TOKEN_HERE" }

# GET request
Invoke-RestMethod -Uri "$baseUrl/endpoint" -Method GET -Headers $headers

# POST request
Invoke-RestMethod -Uri "$baseUrl/endpoint" -Method POST -Body $body -ContentType "application/json" -Headers $headers

# PUT request
Invoke-RestMethod -Uri "$baseUrl/endpoint" -Method PUT -Body $body -ContentType "application/json" -Headers $headers
```

---

## 🎯 Summary

**Easiest Method:** Use the test script (`.\test-auth.ps1`)

**Manual Method:** Copy-paste commands step-by-step from Method 2

**Both methods work!** Choose what's easier for you.




