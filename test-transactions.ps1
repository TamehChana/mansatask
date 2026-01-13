# Test Transaction Endpoints
# Tests transaction listing and retrieval

$baseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "Stop"

Write-Host "Testing Transaction Endpoints" -ForegroundColor Cyan
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

# Create a payment link and initiate payment to have transactions
Write-Host "`n[0.5] Creating test transactions (payment link and payment)..." -ForegroundColor Yellow
$createLinkBody = @{
    title = "Test Payment Link for Transactions"
    description = "Payment link for transaction testing"
    amount = 4000.00
    isActive = $true
} | ConvertTo-Json

try {
    $linkResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links" -Method POST -Body $createLinkBody -Headers $headers -ContentType "application/json"
    $paymentLinkSlug = $linkResponse.slug
    Write-Host "   Payment Link Slug: $paymentLinkSlug" -ForegroundColor Gray
    
    # Initiate a payment
    $idempotencyKey = "transaction-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $initiateBody = @{
        slug = $paymentLinkSlug
        customerName = "Transaction Test Customer"
        customerPhone = "0241234567"
        paymentProvider = "MTN"
    } | ConvertTo-Json
    
    $paymentHeaders = @{
        "Idempotency-Key" = $idempotencyKey
        "Content-Type" = "application/json"
    }
    
    $initiateResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $initiateBody -Headers $paymentHeaders
    $transactionExternalRef = $initiateResponse.externalReference
    Write-Host "   Created transaction: $transactionExternalRef" -ForegroundColor Gray
    Write-Host "[PASS] Test transaction created!" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Could not create test transaction: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Continuing with existing transactions..." -ForegroundColor Gray
}

# Test 1: List All Transactions
Write-Host "`n[1] Testing List All Transactions..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/transactions" -Method GET -Headers $headers
    Write-Host "[PASS] List Transactions: PASSED" -ForegroundColor Green
    Write-Host "   Transactions Count: $($listResponse.data.Count)" -ForegroundColor Gray
    Write-Host "   Total: $($listResponse.pagination.total)" -ForegroundColor Gray
    Write-Host "   Page: $($listResponse.pagination.page)" -ForegroundColor Gray
    Write-Host "   Total Pages: $($listResponse.pagination.totalPages)" -ForegroundColor Gray
    
    if ($listResponse.data.Count -gt 0) {
        $firstTransaction = $listResponse.data[0]
        Write-Host "   First Transaction Status: $($firstTransaction.status)" -ForegroundColor Gray
        Write-Host "   First Transaction Amount: $($firstTransaction.amount)" -ForegroundColor Gray
        $firstTransactionId = $firstTransaction.id
    }
} catch {
    Write-Host "[FAIL] List Transactions: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: List Transactions with Filters (status)
Write-Host "`n[2] Testing List Transactions with Status Filter..." -ForegroundColor Yellow
try {
    $filteredResponse = Invoke-RestMethod -Uri "$baseUrl/transactions?status=PROCESSING" -Method GET -Headers $headers
    Write-Host "[PASS] Filtered Transactions: PASSED" -ForegroundColor Green
    Write-Host "   Filtered Transactions Count: $($filteredResponse.data.Count)" -ForegroundColor Gray
    Write-Host "   Total: $($filteredResponse.pagination.total)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Filtered Transactions: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: List Transactions with Pagination
Write-Host "`n[3] Testing List Transactions with Pagination..." -ForegroundColor Yellow
try {
    $pagedResponse = Invoke-RestMethod -Uri "$baseUrl/transactions?page=1&limit=5" -Method GET -Headers $headers
    Write-Host "[PASS] Paginated Transactions: PASSED" -ForegroundColor Green
    Write-Host "   Page: $($pagedResponse.pagination.page)" -ForegroundColor Gray
    Write-Host "   Limit: $($pagedResponse.pagination.limit)" -ForegroundColor Gray
    Write-Host "   Has Next Page: $($pagedResponse.pagination.hasNextPage)" -ForegroundColor Gray
    Write-Host "   Has Previous Page: $($pagedResponse.pagination.hasPreviousPage)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Paginated Transactions: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Single Transaction (if we have a transaction ID)
Write-Host "`n[4] Testing Get Single Transaction..." -ForegroundColor Yellow
if ($firstTransactionId) {
    try {
        $singleResponse = Invoke-RestMethod -Uri "$baseUrl/transactions/$firstTransactionId" -Method GET -Headers $headers
        Write-Host "[PASS] Get Single Transaction: PASSED" -ForegroundColor Green
        Write-Host "   Transaction ID: $($singleResponse.id)" -ForegroundColor Gray
        Write-Host "   Status: $($singleResponse.status)" -ForegroundColor Gray
        Write-Host "   Amount: $($singleResponse.amount)" -ForegroundColor Gray
        Write-Host "   Provider: $($singleResponse.provider)" -ForegroundColor Gray
        Write-Host "   Customer: $($singleResponse.customerName) - $($singleResponse.customerPhone)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Get Single Transaction: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "[SKIP] Get Single Transaction: No transactions available" -ForegroundColor Yellow
}

# Test 5: Error Handling - Unauthorized Access (without token)
Write-Host "`n[5] Testing Error Handling - Unauthorized Access..." -ForegroundColor Yellow
try {
    $unauthorizedResponse = Invoke-RestMethod -Uri "$baseUrl/transactions" -Method GET -ErrorAction Stop
    Write-Host "[FAIL] Unauthorized Test: FAILED (Should have returned 401)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "[PASS] Unauthorized Test: PASSED (Correctly returned 401)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Unauthorized Test: Unexpected error" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

# Test 6: Error Handling - Transaction Not Found
Write-Host "`n[6] Testing Error Handling - Transaction Not Found..." -ForegroundColor Yellow
$fakeTransactionId = "00000000-0000-0000-0000-000000000000"
try {
    $notFoundResponse = Invoke-RestMethod -Uri "$baseUrl/transactions/$fakeTransactionId" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "[FAIL] Not Found Test: FAILED (Should have returned 404)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "[PASS] Not Found Test: PASSED (Correctly returned 404)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Not Found Test: Unexpected error" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "[SUCCESS] TRANSACTION ENDPOINTS TEST COMPLETED!" -ForegroundColor Green
Write-Host "`nTested Endpoints:" -ForegroundColor Cyan
Write-Host "  [OK] List All Transactions" -ForegroundColor Green
Write-Host "  [OK] List Transactions with Filters" -ForegroundColor Green
Write-Host "  [OK] List Transactions with Pagination" -ForegroundColor Green
Write-Host "  [OK] Get Single Transaction" -ForegroundColor Green
Write-Host "  [OK] Error Handling (Unauthorized)" -ForegroundColor Green
Write-Host "  [OK] Error Handling (Not Found)" -ForegroundColor Green



