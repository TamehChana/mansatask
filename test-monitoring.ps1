# Test Monitoring Features
# This script tests all monitoring features implemented in Phase 7

$API_BASE_URL = "http://localhost:3000/api"
$LOG_DIR = "backend\logs"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Monitoring Features" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "1. Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE_URL/health" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend is not running. Please start it first." -ForegroundColor Red
    Write-Host "   Run: cd backend; npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: Health Check Endpoint
Write-Host "2. Testing Health Check Endpoint..." -ForegroundColor Yellow
Write-Host "   GET $API_BASE_URL/health" -ForegroundColor Gray
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_BASE_URL/health" -Method GET
    Write-Host "   ✅ Health check successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Health Status:" -ForegroundColor Cyan
    Write-Host "   - Overall Status: $($healthResponse.status)" -ForegroundColor $(if ($healthResponse.status -eq 'ok') { 'Green' } else { 'Yellow' })
    Write-Host "   - Uptime: $([math]::Round($healthResponse.uptime, 2)) seconds" -ForegroundColor Gray
    Write-Host "   - Environment: $($healthResponse.environment)" -ForegroundColor Gray
    Write-Host "   - Version: $($healthResponse.version)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Services:" -ForegroundColor Cyan
    Write-Host "   - Database: $($healthResponse.services.database.status) ($($healthResponse.services.database.responseTime)ms)" -ForegroundColor $(if ($healthResponse.services.database.status -eq 'healthy') { 'Green' } else { 'Red' })
    Write-Host "   - Redis: $($healthResponse.services.redis.status) ($($healthResponse.services.redis.responseTime)ms)" -ForegroundColor $(if ($healthResponse.services.redis.status -eq 'healthy') { 'Green' } else { 'Red' })
    Write-Host "   - Storage: $($healthResponse.services.storage.status) ($($healthResponse.services.storage.responseTime)ms)" -ForegroundColor $(if ($healthResponse.services.storage.status -eq 'healthy') { 'Green' } else { 'Red' })
    Write-Host ""
    Write-Host "   Memory Usage:" -ForegroundColor Cyan
    Write-Host "   - Used: $($healthResponse.memory.used) MB" -ForegroundColor Gray
    Write-Host "   - Total: $($healthResponse.memory.total) MB" -ForegroundColor Gray
    Write-Host "   - Percentage: $($healthResponse.memory.percentage)%" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check Log Files
Write-Host "3. Checking Log Files..." -ForegroundColor Yellow
if (Test-Path $LOG_DIR) {
    Write-Host "   ✅ Logs directory exists: $LOG_DIR" -ForegroundColor Green
    
    $logFiles = @(
        "error.log",
        "combined.log",
        "payments.log",
        "exceptions.log",
        "rejections.log"
    )
    
    foreach ($logFile in $logFiles) {
        $logPath = Join-Path $LOG_DIR $logFile
        if (Test-Path $logPath) {
            $fileSize = (Get-Item $logPath).Length
            $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
            Write-Host "   ✅ $logFile exists ($fileSizeKB KB)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $logFile not found (will be created on first log)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠️  Logs directory not found: $LOG_DIR" -ForegroundColor Yellow
    Write-Host "   (Will be created automatically when application starts)" -ForegroundColor Gray
}

Write-Host ""

# Test 3: Test Request Logging
Write-Host "4. Testing Request/Response Logging..." -ForegroundColor Yellow
Write-Host "   Making test requests to generate logs..." -ForegroundColor Gray

# Make a few requests to generate logs
$testEndpoints = @(
    "/health",
    "/auth/login"  # This will fail but will generate logs
)

foreach ($endpoint in $testEndpoints) {
    try {
        $null = Invoke-RestMethod -Uri "$API_BASE_URL$endpoint" -Method GET -ErrorAction SilentlyContinue
    } catch {
        # Expected to fail for some endpoints, but will generate logs
    }
    Start-Sleep -Milliseconds 500
}

Write-Host "   ✅ Test requests completed" -ForegroundColor Green
Write-Host "   Check $LOG_DIR\combined.log for request logs" -ForegroundColor Gray

Write-Host ""

# Test 4: Check Recent Logs
Write-Host "5. Checking Recent Logs..." -ForegroundColor Yellow
$combinedLog = Join-Path $LOG_DIR "combined.log"
if (Test-Path $combinedLog) {
    Write-Host "   Last 5 log entries from combined.log:" -ForegroundColor Cyan
    Get-Content $combinedLog -Tail 5 | ForEach-Object {
        try {
            $logEntry = $_ | ConvertFrom-Json
            $timestamp = $logEntry.timestamp
            $level = $logEntry.level
            $message = $logEntry.message
            $context = if ($logEntry.context) { "[$($logEntry.context)]" } else { "" }
            
            $color = switch ($level) {
                "error" { "Red" }
                "warn" { "Yellow" }
                "info" { "Green" }
                default { "Gray" }
            }
            
            Write-Host "   $timestamp $level $context $message" -ForegroundColor $color
        } catch {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   ⚠️  No logs found yet. Make some API requests to generate logs." -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Test Slow Request Detection (if possible)
Write-Host "6. Performance Monitoring..." -ForegroundColor Yellow
Write-Host "   The logging interceptor automatically detects:" -ForegroundColor Gray
Write-Host "   - Slow requests (>1 second)" -ForegroundColor Gray
Write-Host "   - Slow operations (>500ms)" -ForegroundColor Gray
Write-Host "   Check logs for 'Slow request detected' or 'Slow operation detected' warnings" -ForegroundColor Gray

Write-Host ""

# Test 6: Payment Transaction Logging (if auth token available)
Write-Host "7. Payment Transaction Logging..." -ForegroundColor Yellow
$paymentsLog = Join-Path $LOG_DIR "payments.log"
if (Test-Path $paymentsLog) {
    Write-Host "   ✅ Payment log file exists" -ForegroundColor Green
    $paymentLogCount = (Get-Content $paymentsLog | Measure-Object -Line).Lines
    Write-Host "   - Total payment log entries: $paymentLogCount" -ForegroundColor Gray
    
    if ($paymentLogCount -gt 0) {
        Write-Host "   Last payment log entry:" -ForegroundColor Cyan
        $lastPaymentLog = Get-Content $paymentsLog -Tail 1
        try {
            $paymentEntry = $lastPaymentLog | ConvertFrom-Json
            Write-Host "   - Event: $($paymentEntry.event)" -ForegroundColor Gray
            Write-Host "   - Message: $($paymentEntry.message)" -ForegroundColor Gray
            if ($paymentEntry.externalReference) {
                Write-Host "   - External Reference: $($paymentEntry.externalReference)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   $lastPaymentLog" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No payment logs yet. Make a payment to generate logs." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Payment log file not found yet." -ForegroundColor Yellow
    Write-Host "   (Will be created when first payment is made)" -ForegroundColor Gray
}

Write-Host ""

# Test 7: Error Logging
Write-Host "8. Error Logging..." -ForegroundColor Yellow
$errorLog = Join-Path $LOG_DIR "error.log"
if (Test-Path $errorLog) {
    $errorCount = (Get-Content $errorLog | Measure-Object -Line).Lines
    if ($errorCount -gt 0) {
        Write-Host "   ⚠️  Found $errorCount error log entries" -ForegroundColor Yellow
        Write-Host "   Last error:" -ForegroundColor Cyan
        $lastError = Get-Content $errorLog -Tail 1
        try {
            $errorEntry = $lastError | ConvertFrom-Json
            Write-Host "   - Level: $($errorEntry.level)" -ForegroundColor Red
            Write-Host "   - Message: $($errorEntry.message)" -ForegroundColor Red
            Write-Host "   - Context: $($errorEntry.context)" -ForegroundColor Gray
        } catch {
            Write-Host "   $lastError" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✅ No errors logged (good!)" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ No error log file (no errors yet)" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Monitoring Tests Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Make some API requests to generate more logs" -ForegroundColor Gray
Write-Host "2. Check $LOG_DIR for detailed logs" -ForegroundColor Gray
Write-Host "3. Monitor health endpoint: $API_BASE_URL/health" -ForegroundColor Gray
Write-Host "4. Watch for slow request warnings in logs" -ForegroundColor Gray
Write-Host ""


