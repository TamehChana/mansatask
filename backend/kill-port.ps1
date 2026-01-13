# Kill all processes using port 3000
Write-Host "Finding processes on port 3000..."
$processes = netstat -ano | findstr ":3000" | findstr "LISTENING" | ForEach-Object { 
    ($_ -split '\s+')[-1] 
} | Sort-Object -Unique

if ($processes) {
    Write-Host "Found processes: $($processes -join ', ')"
    foreach ($pid in $processes) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Killing process $pid ($($proc.ProcessName))..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "✅ Port 3000 should be free now"
} else {
    Write-Host "✅ Port 3000 is already free"
}

