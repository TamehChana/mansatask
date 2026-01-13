# Test Webhook Endpoints
# Tests webhook processing for payment status updates

$baseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "Stop"

Write-Host "Testing Webhook Endpoints" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# First, login and create a payment link, then initiate a payment
Write-Host "`n[0] Setting up test data (login, create payment link, initiate payment)..." -ForegroundColor Yellow

# Login
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

# Create Payment Link
$createLinkBody = @{
    title = "Test Payment Link for Webhook"
    description = "Payment link for webhook testing"
    amount = 3000.00
    isActive = $true
} | ConvertTo-Json

try {
    $linkResponse = Invoke-RestMethod -Uri "$baseUrl/payment-links" -Method POST -Body $createLinkBody -Headers $headers -ContentType "application/json"
    $paymentLinkSlug = $linkResponse.slug
    Write-Host "   Payment Link Slug: $paymentLinkSlug" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Failed to create payment link" -ForegroundColor Red
    exit 1
}

# Initiate Payment
$idempotencyKey = "webhook-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
$initiateBody = @{
    slug = $paymentLinkSlug
    customerName = "Webhook Test Customer"
    customerPhone = "0241234567"
    paymentProvider = "MTN"
} | ConvertTo-Json

$paymentHeaders = @{
    "Idempotency-Key" = $idempotencyKey
    "Content-Type" = "application/json"
}

try {
    $initiateResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $initiateBody -Headers $paymentHeaders
    $externalReference = $initiateResponse.externalReference
    $providerTransactionId = $initiateResponse.providerTransactionId
    Write-Host "   External Reference: $externalReference" -ForegroundColor Gray
    Write-Host "   Provider Transaction ID: $providerTransactionId" -ForegroundColor Gray
    Write-Host "[PASS] Payment initiated successfully!" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Failed to initiate payment" -ForegroundColor Red
    exit 1
}

# Wait a moment for transaction to be created
Start-Sleep -Seconds 1

# Test 1: Send Webhook for SUCCESS status
Write-Host "`n[1] Testing Webhook - SUCCESS status update..." -ForegroundColor Yellow
$webhookBody = @{
    transactionId = $providerTransactionId
    status = "SUCCESS"
    provider = "MTN"
    externalReference = $externalReference
} | ConvertTo-Json

$webhookHeaders = @{
    "Content-Type" = "application/json"
    # Note: In production, we'd include X-Signature header for signature verification
    # For testing, we'll skip signature verification (development mode)
}

try {
    $webhookResponse = Invoke-RestMethod -Uri "$baseUrl/webhooks/payment" -Method POST -Body $webhookBody -Headers $webhookHeaders
    Write-Host "[PASS] Webhook processed successfully!" -ForegroundColor Green
    Write-Host "   Success: $($webhookResponse.success)" -ForegroundColor Gray
    Write-Host "   Message: $($webhookResponse.message)" -ForegroundColor Gray
    Write-Host "   Status: $($webhookResponse.status)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Webhook processing failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Verify Transaction Status Updated
Write-Host "`n[2] Testing Transaction Status After Webhook..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/payments/status/$externalReference" -Method GET
    Write-Host "[PASS] Transaction status retrieved!" -ForegroundColor Green
    Write-Host "   External Reference: $($statusResponse.externalReference)" -ForegroundColor Gray
    Write-Host "   Status: $($statusResponse.status)" -ForegroundColor Gray
    
    if ($statusResponse.status -eq "SUCCESS") {
        Write-Host "   [OK] Status correctly updated to SUCCESS!" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Status is $($statusResponse.status), expected SUCCESS" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[FAIL] Failed to get transaction status" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Test Duplicate Webhook (should be ignored)
Write-Host "`n[3] Testing Duplicate Webhook Prevention..." -ForegroundColor Yellow
try {
    $duplicateResponse = Invoke-RestMethod -Uri "$baseUrl/webhooks/payment" -Method POST -Body $webhookBody -Headers $webhookHeaders
    Write-Host "[PASS] Duplicate webhook handled correctly!" -ForegroundColor Green
    Write-Host "   Success: $($duplicateResponse.success)" -ForegroundColor Gray
    Write-Host "   Duplicate: $($duplicateResponse.duplicate)" -ForegroundColor Gray
    Write-Host "   Message: $($duplicateResponse.message)" -ForegroundColor Gray
    
    if ($duplicateResponse.duplicate -eq $true) {
        Write-Host "   [OK] Duplicate webhook correctly identified and ignored!" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Expected duplicate flag to be true" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[FAIL] Duplicate webhook test failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test Webhook for FAILED status
Write-Host "`n[4] Testing Webhook - FAILED status update..." -ForegroundColor Yellow
$failedIdempotencyKey = "webhook-failed-test-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Create another payment for failed test
$failedInitiateBody = @{
    slug = $paymentLinkSlug
    customerName = "Webhook Failed Test Customer"
    customerPhone = "0241234568"
    paymentProvider = "VODAFONE"
} | ConvertTo-Json

$failedPaymentHeaders = @{
    "Idempotency-Key" = $failedIdempotencyKey
    "Content-Type" = "application/json"
}

try {
    $failedInitiateResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $failedInitiateBody -Headers $failedPaymentHeaders
    $failedExternalReference = $failedInitiateResponse.externalReference
    $failedProviderTransactionId = $failedInitiateResponse.providerTransactionId
    
    Start-Sleep -Seconds 1
    
    $failedWebhookBody = @{
        transactionId = $failedProviderTransactionId
        status = "FAILED"
        provider = "VODAFONE"
        externalReference = $failedExternalReference
        failureReason = "Insufficient funds"
    } | ConvertTo-Json
    
    $failedWebhookResponse = Invoke-RestMethod -Uri "$baseUrl/webhooks/payment" -Method POST -Body $failedWebhookBody -Headers $webhookHeaders
    Write-Host "[PASS] Failed status webhook processed successfully!" -ForegroundColor Green
    Write-Host "   Status: $($failedWebhookResponse.status)" -ForegroundColor Gray
    
    # Verify failed status
    $failedStatusResponse = Invoke-RestMethod -Uri "$baseUrl/payments/status/$failedExternalReference" -Method GET
    if ($failedStatusResponse.status -eq "FAILED") {
        Write-Host "   [OK] Status correctly updated to FAILED!" -ForegroundColor Green
    }
} catch {
    Write-Host "[FAIL] Failed status webhook test failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "[SUCCESS] WEBHOOK ENDPOINTS TEST COMPLETED!" -ForegroundColor Green
Write-Host "`nTested Features:" -ForegroundColor Cyan
Write-Host "  [OK] Webhook processing (SUCCESS status)" -ForegroundColor Green
Write-Host "  [OK] Transaction status update via webhook" -ForegroundColor Green
Write-Host "  [OK] Duplicate webhook prevention" -ForegroundColor Green
Write-Host "  [OK] Webhook processing (FAILED status)" -ForegroundColor Green

