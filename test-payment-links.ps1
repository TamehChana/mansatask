# Test Payment Links Endpoints
# Tests all Payment Links endpoints: Create, List, Get, Update, Delete, Public

$baseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "Stop"

Write-Host "Testing Payment Links Endpoints" -ForegroundColor Cyan
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
    # Try to register
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
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$headers = @{
    Authorization = "Bearer $accessToken"
}

# Test 1: Create Payment Link
Write-Host "`n[1] Testing Create Payment Link..." -ForegroundColor Yellow
$createBody = @{
    title = "Test Payment Link"
    description = "A test payment link for testing"
    amount = 1500.50
    expiresAfterDays = 30
    maxUses = 10
    isActive = $true
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links" -Method POST -Body $createBody -Headers $headers -ContentType "application/json"
    Write-Host "[PASS] Create Payment Link: PASSED" -ForegroundColor Green
    Write-Host "   Payment Link ID: $($createResponse.id)" -ForegroundColor Gray
    Write-Host "   Slug: $($createResponse.slug)" -ForegroundColor Gray
    Write-Host "   Title: $($createResponse.title)" -ForegroundColor Gray
    Write-Host "   Amount: $($createResponse.amount)" -ForegroundColor Gray
    $paymentLinkId = $createResponse.id
    $paymentLinkSlug = $createResponse.slug
} catch {
    Write-Host "[FAIL] Create Payment Link: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
    }
    exit 1
}

# Test 2: List Payment Links
Write-Host "`n[2] Testing List Payment Links..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links" -Method GET -Headers $headers
    Write-Host "[PASS] List Payment Links: PASSED" -ForegroundColor Green
    Write-Host "   Payment Links Count: $($listResponse.Count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] List Payment Links: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get Single Payment Link
Write-Host "`n[3] Testing Get Single Payment Link..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/$paymentLinkId" -Method GET -Headers $headers
    Write-Host "[PASS] Get Single Payment Link: PASSED" -ForegroundColor Green
    Write-Host "   Title: $($getResponse.title)" -ForegroundColor Gray
    Write-Host "   Slug: $($getResponse.slug)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Get Single Payment Link: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get Public Payment Link (by slug - no auth)
Write-Host "`n[4] Testing Get Public Payment Link (by slug - no auth)..." -ForegroundColor Yellow
try {
    $publicResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/public/$paymentLinkSlug" -Method GET
    Write-Host "[PASS] Get Public Payment Link: PASSED" -ForegroundColor Green
    Write-Host "   Title: $($publicResponse.title)" -ForegroundColor Gray
    Write-Host "   Amount: $($publicResponse.amount)" -ForegroundColor Gray
    Write-Host "   Is Active: $($publicResponse.isActive)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Get Public Payment Link: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Update Payment Link
Write-Host "`n[5] Testing Update Payment Link..." -ForegroundColor Yellow
$updateBody = @{
    title = "Updated Payment Link"
    amount = 2000.00
    isActive = $true
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/$paymentLinkId" -Method PATCH -Body $updateBody -Headers $headers -ContentType "application/json"
    Write-Host "[PASS] Update Payment Link: PASSED" -ForegroundColor Green
    Write-Host "   Updated Title: $($updateResponse.title)" -ForegroundColor Gray
    Write-Host "   Updated Amount: $($updateResponse.amount)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Update Payment Link: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Delete Payment Link
Write-Host "`n[6] Testing Delete Payment Link..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/$paymentLinkId" -Method DELETE -Headers $headers
    Write-Host "[PASS] Delete Payment Link: PASSED" -ForegroundColor Green
    Write-Host "   Message: $($deleteResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Delete Payment Link: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 7: Verify Public Link is Inactive (should fail)
Write-Host "`n[7] Testing Public Link After Deletion (should fail)..." -ForegroundColor Yellow
try {
    $deletedResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links/public/$paymentLinkSlug" -Method GET
    Write-Host "[FAIL] Public Link Test: FAILED (Should have returned error)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400 -or $_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "[PASS] Public Link Test: PASSED (Correctly returned error after deletion)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Public Link Test: Unexpected error" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "[SUCCESS] ALL PAYMENT LINKS TESTS COMPLETED!" -ForegroundColor Green
Write-Host "`nTested Endpoints:" -ForegroundColor Cyan
Write-Host "  [OK] Create Payment Link" -ForegroundColor Green
Write-Host "  [OK] List Payment Links" -ForegroundColor Green
Write-Host "  [OK] Get Single Payment Link" -ForegroundColor Green
Write-Host "  [OK] Get Public Payment Link (by slug)" -ForegroundColor Green
Write-Host "  [OK] Update Payment Link" -ForegroundColor Green
Write-Host "  [OK] Delete Payment Link" -ForegroundColor Green
Write-Host "  [OK] Public Link Validation" -ForegroundColor Green




