# Backend Startup Script
# This script ensures port 3000 is free before starting the backend

Write-Host "=== Backend Startup Script ===" -ForegroundColor Cyan

# Step 1: Kill any processes using port 3000
Write-Host "`n[1/3] Checking for processes on port 3000..." -ForegroundColor Yellow
$processes = netstat -ano | findstr ":3000" | findstr "LISTENING" | ForEach-Object { 
    ($_ -split '\s+')[-1] 
} | Sort-Object -Unique

if ($processes) {
    Write-Host "Found processes: $($processes -join ', ')" -ForegroundColor Yellow
    foreach ($pid in $processes) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Killing process $pid ($($proc.ProcessName))..." -ForegroundColor Red
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  Port 3000 is free" -ForegroundColor Green
}

# Step 2: Kill any backend node processes
Write-Host "`n[2/3] Checking for backend node processes..." -ForegroundColor Yellow
$backendProcs = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $cmdline = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    $cmdline -like "*MANSATASK*backend*"
}

if ($backendProcs) {
    foreach ($proc in $backendProcs) {
        Write-Host "  Killing backend process $($proc.Id)..." -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  No backend processes found" -ForegroundColor Green
}

# Step 3: Verify port is free
Write-Host "`n[3/3] Verifying port 3000 is free..." -ForegroundColor Yellow
$stillInUse = netstat -ano | findstr ":3000" | findstr "LISTENING"
if ($stillInUse) {
    Write-Host "  ❌ Port 3000 is still in use!" -ForegroundColor Red
    Write-Host "  Please manually kill the process and try again" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✅ Port 3000 is free" -ForegroundColor Green
}

# Step 4: Start backend
Write-Host "`n=== Starting Backend ===" -ForegroundColor Cyan
Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

Set-Location $PSScriptRoot
npm run start:dev

