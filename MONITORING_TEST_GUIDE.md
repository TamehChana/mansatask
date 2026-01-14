# Monitoring Features Test Guide

This guide explains how to test all monitoring features implemented in Phase 7.

## Prerequisites

1. **Backend must be running**
   ```powershell
   cd backend
   npm run start:dev
   ```

2. **Ensure logs directory exists**
   - The `backend/logs/` directory is created automatically when the app starts
   - If it doesn't exist, create it manually:
     ```powershell
     mkdir backend\logs
     ```

## Quick Test Script

Run the automated test script:

```powershell
.\test-monitoring.ps1
```

This script will test:
- Health check endpoint
- Log file creation
- Request/response logging
- Recent log entries
- Payment transaction logging
- Error logging

## Manual Testing

### 1. Health Check Endpoint

**Test the health check:**
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET

# Or use curl
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "redis": {
      "status": "healthy",
      "responseTime": 2
    },
    "storage": {
      "status": "healthy",
      "responseTime": 1
    }
  },
  "memory": {
    "used": 150,
    "total": 512,
    "percentage": 29.3
  }
}
```

**What to check:**
- ✅ All services show `"status": "healthy"`
- ✅ Response times are reasonable (<100ms for database, <10ms for Redis)
- ✅ Memory usage is reasonable
- ✅ Overall status is `"ok"`

### 2. Request/Response Logging

**Make some test requests:**
```powershell
# Health check (should succeed)
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET

# Login attempt (should fail but generate logs)
$body = @{
    email = "test@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

**Check the logs:**
```powershell
# View recent logs
Get-Content backend\logs\combined.log -Tail 20

# Or view in real-time (PowerShell 7+)
Get-Content backend\logs\combined.log -Wait -Tail 10
```

**What to look for:**
- ✅ Each request is logged with method, URL, IP, user agent
- ✅ Each response is logged with status code, duration, content length
- ✅ Slow requests (>1 second) show warnings

**Example log entry:**
```json
{
  "timestamp": "2024-01-01 12:00:00",
  "level": "info",
  "message": "GET /api/health 200 15ms - 234bytes",
  "context": "HTTP",
  "method": "GET",
  "url": "/api/health",
  "statusCode": 200,
  "duration": 15,
  "ip": "::1",
  "userAgent": "Mozilla/5.0..."
}
```

### 3. Performance Monitoring

**Test slow operation detection:**

The logging interceptor automatically detects:
- Slow requests (>1 second)
- Slow operations (>500ms)

**To test, you can:**
1. Make a request that takes time (e.g., complex database query)
2. Check logs for warnings:
   ```powershell
   Get-Content backend\logs\combined.log | Select-String "Slow"
   ```

**Expected warnings:**
```
Slow request detected: GET /api/some-endpoint took 1200ms
Slow operation detected: SomeService.someMethod took 600ms
```

### 4. Payment Transaction Logging

**Make a payment request:**
```powershell
# First, get auth token (register/login)
# Then make a payment request
# See test-payments.ps1 for full example
```

**Check payment logs:**
```powershell
# View payment-specific logs
Get-Content backend\logs\payments.log -Tail 20
```

**What to look for:**
- ✅ Payment initiation events
- ✅ Transaction creation events
- ✅ Payment success/failure events
- ✅ Full transaction context in logs

**Example payment log entry:**
```json
{
  "timestamp": "2024-01-01 12:00:00",
  "level": "info",
  "message": "Payment initiated successfully: TXN-1234567890-ABC123",
  "context": "PaymentsService",
  "event": "payment_initiated",
  "externalReference": "TXN-1234567890-ABC123",
  "transactionId": "uuid-here",
  "providerTransactionId": "provider-id",
  "amount": 1000,
  "paymentProvider": "MTN"
}
```

### 5. Error Logging

**Generate an error:**
```powershell
# Make a request to a non-existent endpoint
Invoke-RestMethod -Uri "http://localhost:3000/api/nonexistent" -Method GET
```

**Check error logs:**
```powershell
# View error logs
Get-Content backend\logs\error.log -Tail 10
```

**What to look for:**
- ✅ Errors are logged with stack traces
- ✅ Error context is included (method, URL, handler)
- ✅ Payment errors include transaction context

### 6. Log File Rotation

**Test log rotation:**
- Log files are automatically rotated when they reach 5MB (10MB for payments.log)
- Old logs are kept (5 files for most logs, 10 files for payments.log)

**Check log file sizes:**
```powershell
Get-ChildItem backend\logs\*.log | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB,2)}}
```

### 7. Structured Logging

**Verify log structure:**
```powershell
# Get a log entry and parse it
$logEntry = Get-Content backend\logs\combined.log -Tail 1
$parsed = $logEntry | ConvertFrom-Json

# Check structure
$parsed | Format-List
```

**Expected structure:**
- `timestamp`: ISO timestamp
- `level`: log level (error, warn, info, debug)
- `message`: log message
- `context`: service/component name
- `service`: "payment-link-platform"
- `environment`: "development" or "production"
- Additional context fields based on event type

## Monitoring Dashboard (Optional)

You can create a simple monitoring dashboard by:

1. **Health Check Monitor:**
   ```powershell
   # Continuous health check
   while ($true) {
       $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
       Write-Host "$(Get-Date -Format 'HH:mm:ss') - Status: $($health.status) - DB: $($health.services.database.status) - Redis: $($health.services.redis.status)"
       Start-Sleep -Seconds 5
   }
   ```

2. **Log Monitor:**
   ```powershell
   # Watch logs in real-time
   Get-Content backend\logs\combined.log -Wait -Tail 50
   ```

3. **Error Monitor:**
   ```powershell
   # Watch for new errors
   Get-Content backend\logs\error.log -Wait -Tail 10
   ```

## Integration with Log Aggregation Tools

The logs are in JSON format, making them easy to integrate with:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog**
- **Splunk**
- **CloudWatch** (AWS)
- **Azure Monitor**

**Example log entry format:**
```json
{
  "timestamp": "2024-01-01 12:00:00",
  "level": "info",
  "message": "Payment initiated successfully",
  "context": "PaymentsService",
  "service": "payment-link-platform",
  "environment": "production",
  "event": "payment_initiated",
  "externalReference": "TXN-1234567890-ABC123",
  "transactionId": "uuid-here",
  "amount": 1000,
  "paymentProvider": "MTN"
}
```

## Troubleshooting

### Logs not appearing?
1. Check if backend is running
2. Check if `backend/logs/` directory exists
3. Check file permissions
4. Check Winston configuration in `backend/src/common/logger/winston.config.ts`

### Health check failing?
1. Check database connection
2. Check Redis connection
3. Check environment variables
4. Check service logs for errors

### Slow request detection not working?
- Slow request threshold is 1 second
- Slow operation threshold is 500ms
- Check if requests are actually slow
- Check logs for "Slow request detected" or "Slow operation detected"

## Next Steps

1. **Set up log aggregation** (ELK, Datadog, etc.)
2. **Create monitoring dashboards**
3. **Set up alerts** for:
   - High error rates
   - Slow requests
   - Health check failures
   - Payment failures
4. **Configure log retention policies**
5. **Set up log rotation** (if not using default)

---

**For more information, see:** `PHASE_7_MONITORING_COMPLETE.md`


