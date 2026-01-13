# Test Authentication Endpoints - Payment Link Platform
# Run this script to test all authentication endpoints

$baseUrl = "http://localhost:3000/api"

Write-Host "🧪 Testing Authentication Endpoints" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 1. Register a new user
Write-Host "`n1. Testing Registration..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "   User: $($registerResponse.user.name) ($($registerResponse.user.email))" -ForegroundColor Gray
    $accessToken = $registerResponse.accessToken
    $refreshToken = $registerResponse.refreshToken
    Write-Host "   Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Get Profile (Protected endpoint)
Write-Host "`n2. Testing Get Profile (Protected)..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $accessToken"
}

try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers
    Write-Host "✅ Profile retrieved successfully!" -ForegroundColor Green
    Write-Host "   Name: $($profileResponse.name)" -ForegroundColor Gray
    Write-Host "   Email: $($profileResponse.email)" -ForegroundColor Gray
    Write-Host "   Role: $($profileResponse.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Get profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Update Profile (Protected endpoint)
Write-Host "`n3. Testing Update Profile (Protected)..." -ForegroundColor Yellow
$updateBody = @{
    name = "Test User Updated"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method PUT -Body $updateBody -Headers $headers -ContentType "application/json"
    Write-Host "✅ Profile updated successfully!" -ForegroundColor Green
    Write-Host "   New Name: $($updateResponse.name)" -ForegroundColor Gray
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
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Refresh Token
Write-Host "`n5. Testing Refresh Token..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
    Write-Host "✅ Token refreshed successfully!" -ForegroundColor Green
    Write-Host "   New Access Token: $($refreshResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Refresh token failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host "`nNote: Test Forgot Password and Reset Password manually using the examples in TESTING_AUTH_ENDPOINTS.md" -ForegroundColor Gray



