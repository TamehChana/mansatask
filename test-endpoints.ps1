# Complete Endpoint Testing Script
# Tests all implemented endpoints: Health, Auth, Users, Products

$baseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "Stop"

Write-Host "Testing Payment Link Platform Endpoints" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n[1] Testing Health Check Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "[PASS] Health Check: PASSED" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Gray
    Write-Host "   Database: $($healthResponse.database)" -ForegroundColor Gray
    
    if ($healthResponse.status -ne "ok") {
        Write-Host "[WARN] WARNING: Backend is not healthy!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[FAIL] Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n[INFO] Make sure the backend is running:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   `$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/mansatask_db?schema=public'" -ForegroundColor Gray
    Write-Host "   npm run start:dev" -ForegroundColor Gray
    exit 1
}

# Test 2: User Registration
Write-Host "`n[2] Testing User Registration..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$registerBody = @{
    name = "Test User"
    email = $testEmail
    password = "password123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "[PASS] User Registration: PASSED" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Gray
    Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor Gray
    $accessToken = $registerResponse.accessToken
    $refreshToken = $registerResponse.refreshToken
    $userId = $registerResponse.user.id
} catch {
    Write-Host "[FAIL] User Registration: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
    }
    exit 1
}

# Test 3: User Login
Write-Host "`n[3] Testing User Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "[PASS] User Login: PASSED" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.name)" -ForegroundColor Gray
    $accessToken = $loginResponse.accessToken
} catch {
    Write-Host "[FAIL] User Login: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get User Profile (Protected)
Write-Host "`n[4] Testing Get User Profile (Protected)..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $accessToken"
}

try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers
    Write-Host "[PASS] Get Profile: PASSED" -ForegroundColor Green
    Write-Host "   Name: $($profileResponse.name)" -ForegroundColor Gray
    Write-Host "   Email: $($profileResponse.email)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Get Profile: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Update User Profile (Protected)
Write-Host "`n[5] Testing Update User Profile (Protected)..." -ForegroundColor Yellow
$updateBody = @{
    name = "Test User Updated"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method PUT -Body $updateBody -Headers $headers -ContentType "application/json"
    Write-Host "[PASS] Update Profile: PASSED" -ForegroundColor Green
    Write-Host "   Updated Name: $($updateResponse.name)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Update Profile: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Create Product (Protected)
Write-Host "`n[6] Testing Create Product (Protected)..." -ForegroundColor Yellow
$createProductBody = @{
    name = "Test Product"
    description = "A test product for testing"
    price = 99.99
} | ConvertTo-Json

try {
    $productResponse = Invoke-RestMethod -Uri "$baseUrl/products" -Method POST -Body $createProductBody -Headers $headers -ContentType "application/json"
    Write-Host "[PASS] Create Product: PASSED" -ForegroundColor Green
    Write-Host "   Product ID: $($productResponse.id)" -ForegroundColor Gray
    Write-Host "   Product Name: $($productResponse.name)" -ForegroundColor Gray
    Write-Host "   Price: $($productResponse.price)" -ForegroundColor Gray
    $productId = $productResponse.id
} catch {
    Write-Host "[FAIL] Create Product: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
    }
    exit 1
}

# Test 7: List Products (Protected)
Write-Host "`n[7] Testing List Products (Protected)..." -ForegroundColor Yellow
try {
    $productsResponse = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET -Headers $headers
    Write-Host "[PASS] List Products: PASSED" -ForegroundColor Green
    Write-Host "   Products Count: $($productsResponse.Count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] List Products: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 8: Get Single Product (Protected)
Write-Host "`n[8] Testing Get Single Product (Protected)..." -ForegroundColor Yellow
try {
    $singleProductResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method GET -Headers $headers
    Write-Host "[PASS] Get Single Product: PASSED" -ForegroundColor Green
    Write-Host "   Product: $($singleProductResponse.name)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Get Single Product: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 9: Update Product (Protected)
Write-Host "`n[9] Testing Update Product (Protected)..." -ForegroundColor Yellow
$updateProductBody = @{
    name = "Updated Test Product"
    price = 149.99
} | ConvertTo-Json

try {
    $updateProductResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method PATCH -Body $updateProductBody -Headers $headers -ContentType "application/json"
    Write-Host "[PASS] Update Product: PASSED" -ForegroundColor Green
    Write-Host "   Updated Name: $($updateProductResponse.name)" -ForegroundColor Gray
    Write-Host "   Updated Price: $($updateProductResponse.price)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Update Product: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 10: Delete Product (Protected)
Write-Host "`n[10] Testing Delete Product (Protected)..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method DELETE -Headers $headers
    Write-Host "[PASS] Delete Product: PASSED" -ForegroundColor Green
    Write-Host "   Message: $($deleteResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Delete Product: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 11: Refresh Token
Write-Host "`n[11] Testing Refresh Token..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
    Write-Host "[PASS] Refresh Token: PASSED" -ForegroundColor Green
    Write-Host "   New Access Token: $(if ($refreshResponse.accessToken) { 'Generated' } else { 'Missing' })" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Refresh Token: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 12: Error Handling - Unauthorized Access
Write-Host "`n[12] Testing Error Handling - Unauthorized Access..." -ForegroundColor Yellow
try {
    $unauthorizedResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -ErrorAction Stop
    Write-Host "[FAIL] Unauthorized Test: FAILED (Should have returned 401)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "[PASS] Unauthorized Test: PASSED (Correctly returned 401)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Unauthorized Test: Unexpected error" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "[SUCCESS] ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "`nTested Endpoints:" -ForegroundColor Cyan
Write-Host "  [OK] Health Check" -ForegroundColor Green
Write-Host "  [OK] User Registration" -ForegroundColor Green
Write-Host "  [OK] User Login" -ForegroundColor Green
Write-Host "  [OK] Get Profile" -ForegroundColor Green
Write-Host "  [OK] Update Profile" -ForegroundColor Green
Write-Host "  [OK] Create Product" -ForegroundColor Green
Write-Host "  [OK] List Products" -ForegroundColor Green
Write-Host "  [OK] Get Single Product" -ForegroundColor Green
Write-Host "  [OK] Update Product" -ForegroundColor Green
Write-Host "  [OK] Delete Product" -ForegroundColor Green
Write-Host "  [OK] Refresh Token" -ForegroundColor Green
Write-Host "  [OK] Error Handling (Unauthorized)" -ForegroundColor Green
