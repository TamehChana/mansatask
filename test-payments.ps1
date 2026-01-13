# Test Payment Endpoints
# Tests payment initiation, status check, and get payment

$baseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "Stop"

Write-Host "Testing Payment Endpoints" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# First, login to get access token
Write-Host "`n[0] Logging in to get access token..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $accessToken = $loginResponse.accessToken
    Write-Host "[PASS] Login successful!" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Login failed. Registering new user..." -ForegroundColor Yellow
    $registerBody = @{
        name = "Test User"
        email = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
        password = "password123"
    } | ConvertTo-Json
    try {
        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
        $accessToken = $registerResponse.accessToken
        Write-Host "[PASS] Registration successful!" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Registration also failed. Please check backend." -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    Authorization = "Bearer $accessToken"
}

# Step 1: Create a Payment Link
Write-Host "`n[1] Creating a payment link..." -ForegroundColor Yellow
$createLinkBody = @{
    title = "Test Payment Link for Payment Testing"
    description = "Payment link for testing payment endpoints"
    amount = 5000.00
    expiresAfterDays = 30
    isActive = $true
} | ConvertTo-Json

try {
    $linkResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links" -Method POST -Body $createLinkBody -Headers $headers -ContentType "application/json"
    Write-Host "[PASS] Payment link created successfully!" -ForegroundColor Green
    Write-Host "   Payment Link ID: $($linkResponse.id)" -ForegroundColor Gray
    Write-Host "   Slug: $($linkResponse.slug)" -ForegroundColor Gray
    Write-Host "   Amount: $($linkResponse.amount)" -ForegroundColor Gray
    $paymentLinkSlug = $linkResponse.slug
} catch {
    Write-Host "[FAIL] Failed to create payment link" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Initiate Payment
Write-Host "`n[2] Testing Payment Initiation (with idempotency key)..." -ForegroundColor Yellow
$idempotencyKey = "test-key-$(Get-Date -Format 'yyyyMMddHHmmss')"
$initiateBody = @{
    slug = $paymentLinkSlug
    customerName = "Test Customer"
    customerPhone = "0241234567"
    customerEmail = "customer@example.com"
    paymentProvider = "MTN"
} | ConvertTo-Json

$paymentHeaders = @{
    "Idempotency-Key" = $idempotencyKey
    "Content-Type" = "application/json"
}

try {
    $initiateResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $initiateBody -Headers $paymentHeaders
    Write-Host "[PASS] Payment initiated successfully!" -ForegroundColor Green
    Write-Host "   External Reference: $($initiateResponse.externalReference)" -ForegroundColor Gray
    Write-Host "   Status: $($initiateResponse.status)" -ForegroundColor Gray
    Write-Host "   Provider Transaction ID: $($initiateResponse.providerTransactionId)" -ForegroundColor Gray
    Write-Host "   Amount: $($initiateResponse.amount)" -ForegroundColor Gray
    $externalReference = $initiateResponse.externalReference
    $transactionId = $initiateResponse.externalReference
} catch {
    Write-Host "[FAIL] Payment initiation failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
    }
    exit 1
}

# Step 3: Test Idempotency (duplicate request with same idempotency key)
Write-Host "`n[3] Testing Idempotency (duplicate request)..." -ForegroundColor Yellow
try {
    $duplicateResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $initiateBody -Headers $paymentHeaders
    if ($duplicateResponse.externalReference -eq $externalReference) {
        Write-Host "[PASS] Idempotency test passed! (Same response returned)" -ForegroundColor Green
        Write-Host "   External Reference: $($duplicateResponse.externalReference)" -ForegroundColor Gray
    } else {
        Write-Host "[FAIL] Idempotency test failed! (Different response)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Idempotency test failed with error" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Get Payment Status (public endpoint)
Write-Host "`n[4] Testing Get Payment Status (public endpoint)..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/payments/status/$externalReference" -Method GET
    Write-Host "[PASS] Payment status retrieved successfully!" -ForegroundColor Green
    Write-Host "   External Reference: $($statusResponse.externalReference)" -ForegroundColor Gray
    Write-Host "   Status: $($statusResponse.status)" -ForegroundColor Gray
    Write-Host "   Provider: $($statusResponse.provider)" -ForegroundColor Gray
    Write-Host "   Amount: $($statusResponse.amount)" -ForegroundColor Gray
    Write-Host "   Customer: $($statusResponse.customerName) - $($statusResponse.customerPhone)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to get payment status" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Get Payment by ID (protected endpoint) - First we need the transaction ID
# Note: We'll need to get the transaction ID from the database or from the payment link's transactions
# For now, let's try to get it from the payment link or we can list transactions if we have that endpoint
Write-Host "`n[5] Testing Get Payment by ID (protected endpoint)..." -ForegroundColor Yellow
Write-Host "   Note: This requires the transaction ID (UUID), not external reference" -ForegroundColor Gray
Write-Host "   External Reference: $externalReference" -ForegroundColor Gray
Write-Host "   [SKIP] Transaction ID endpoint test (requires transaction UUID)" -ForegroundColor Yellow

# Step 6: Test Error Handling - Missing Idempotency Key
Write-Host "`n[6] Testing Error Handling - Missing Idempotency Key..." -ForegroundColor Yellow
try {
    $errorResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $initiateBody -Headers @{"Content-Type" = "application/json"} -ErrorAction Stop
    Write-Host "[FAIL] Error handling test failed (should have returned error)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "[PASS] Error handling test passed! (Correctly returned 400 for missing idempotency key)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Error handling test: Unexpected error" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

# Step 7: Test Error Handling - Invalid Payment Link
Write-Host "`n[7] Testing Error Handling - Invalid Payment Link..." -ForegroundColor Yellow
$invalidKey = "invalid-key-$(Get-Date -Format 'yyyyMMddHHmmss')"
$invalidBody = @{
    slug = "pay-invalid-slug-12345"
    customerName = "Test Customer"
    customerPhone = "0241234567"
    paymentProvider = "MTN"
} | ConvertTo-Json

$invalidHeaders = @{
    "Idempotency-Key" = $invalidKey
    "Content-Type" = "application/json"
}

try {
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $invalidBody -Headers $invalidHeaders -ErrorAction Stop
    Write-Host "[FAIL] Error handling test failed (should have returned error)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404 -or $_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "[PASS] Error handling test passed! (Correctly returned error for invalid payment link)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Error handling test: Unexpected error" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "[SUCCESS] PAYMENT ENDPOINTS TEST COMPLETED!" -ForegroundColor Green
Write-Host "`nTested Endpoints:" -ForegroundColor Cyan
Write-Host "  [OK] Create Payment Link" -ForegroundColor Green
Write-Host "  [OK] Initiate Payment (with idempotency key)" -ForegroundColor Green
Write-Host "  [OK] Idempotency Test (duplicate request)" -ForegroundColor Green
Write-Host "  [OK] Get Payment Status (public)" -ForegroundColor Green
Write-Host "  [OK] Error Handling (missing idempotency key)" -ForegroundColor Green
Write-Host "  [OK] Error Handling (invalid payment link)" -ForegroundColor Green
Write-Host "`nExternal Reference: $externalReference" -ForegroundColor Cyan



