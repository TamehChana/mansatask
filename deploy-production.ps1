# Production Deployment Script
# This script helps deploy the Payment Link Platform to production

param(
    [switch]$Build,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Logs,
    [switch]$Health,
    [switch]$Status,
    [switch]$Update,
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Link Platform - Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    } catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        return $false
    }
}

# Check if docker-compose is available
function Test-DockerCompose {
    try {
        docker compose version | Out-Null
        return $true
    } catch {
        Write-Host "❌ Docker Compose is not available." -ForegroundColor Red
        return $false
    }
}

# Validate environment file
function Test-EnvironmentFile {
    if (-not (Test-Path ".env.production")) {
        Write-Host "⚠️  .env.production file not found." -ForegroundColor Yellow
        Write-Host "   Creating from .env.production.example..." -ForegroundColor Gray
        
        if (Test-Path ".env.production.example") {
            Copy-Item ".env.production.example" ".env.production"
            Write-Host "   ✅ Created .env.production" -ForegroundColor Green
            Write-Host "   ⚠️  Please edit .env.production and fill in your production values!" -ForegroundColor Yellow
            Write-Host "   Then run this script again." -ForegroundColor Gray
            return $false
        } else {
            Write-Host "   ❌ .env.production.example not found!" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

# Build production images
function Build-Production {
    Write-Host "🔨 Building production images..." -ForegroundColor Yellow
    Write-Host ""
    
    docker compose -f docker-compose.prod.yml build --no-cache
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Production images built successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

# Start production services
function Start-Production {
    Write-Host "🚀 Starting production services..." -ForegroundColor Yellow
    Write-Host ""
    
    docker compose -f docker-compose.prod.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Production services started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services:" -ForegroundColor Cyan
        Write-Host "  - Backend: http://localhost:3000/api" -ForegroundColor Gray
        Write-Host "  - Frontend: http://localhost:3001" -ForegroundColor Gray
        Write-Host "  - Database: localhost:5432" -ForegroundColor Gray
        Write-Host "  - Redis: localhost:6379" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Run '.\deploy-production.ps1 -Health' to check service health" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Failed to start services!" -ForegroundColor Red
        exit 1
    }
}

# Stop production services
function Stop-Production {
    Write-Host "🛑 Stopping production services..." -ForegroundColor Yellow
    Write-Host ""
    
    docker compose -f docker-compose.prod.yml down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Production services stopped!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Failed to stop services!" -ForegroundColor Red
        exit 1
    }
}

# Restart production services
function Restart-Production {
    Write-Host "🔄 Restarting production services..." -ForegroundColor Yellow
    Write-Host ""
    
    Stop-Production
    Start-Sleep -Seconds 2
    Start-Production
}

# Show logs
function Show-Logs {
    if ($Service) {
        Write-Host "📋 Showing logs for $Service..." -ForegroundColor Yellow
        docker compose -f docker-compose.prod.yml logs -f $Service
    } else {
        Write-Host "📋 Showing logs for all services..." -ForegroundColor Yellow
        docker compose -f docker-compose.prod.yml logs -f
    }
}

# Check health
function Check-Health {
    Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check backend health
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
        Write-Host "✅ Backend Health:" -ForegroundColor Green
        Write-Host "   Status: $($health.status)" -ForegroundColor Gray
        Write-Host "   Database: $($health.services.database.status)" -ForegroundColor Gray
        Write-Host "   Redis: $($health.services.redis.status)" -ForegroundColor Gray
        Write-Host "   Storage: $($health.services.storage.status)" -ForegroundColor Gray
        Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend: Running" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Frontend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Check Docker containers
    Write-Host "🐳 Docker Containers:" -ForegroundColor Cyan
    docker compose -f docker-compose.prod.yml ps
}

# Show status
function Show-Status {
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    Write-Host ""
    docker compose -f docker-compose.prod.yml ps
}

# Update services (pull latest, rebuild, restart)
function Update-Production {
    Write-Host "🔄 Updating production services..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "1. Pulling latest images..." -ForegroundColor Gray
    docker compose -f docker-compose.prod.yml pull
    
    Write-Host ""
    Write-Host "2. Rebuilding services..." -ForegroundColor Gray
    Build-Production
    
    Write-Host ""
    Write-Host "3. Restarting services..." -ForegroundColor Gray
    Restart-Production
    
    Write-Host ""
    Write-Host "✅ Update complete!" -ForegroundColor Green
}

# Main execution
if (-not (Test-Docker)) {
    exit 1
}

if (-not (Test-DockerCompose)) {
    exit 1
}

# Handle different commands
if ($Build) {
    if (-not (Test-EnvironmentFile)) {
        exit 1
    }
    Build-Production
} elseif ($Start) {
    if (-not (Test-EnvironmentFile)) {
        exit 1
    }
    Start-Production
} elseif ($Stop) {
    Stop-Production
} elseif ($Restart) {
    if (-not (Test-EnvironmentFile)) {
        exit 1
    }
    Restart-Production
} elseif ($Logs) {
    Show-Logs
} elseif ($Health) {
    Check-Health
} elseif ($Status) {
    Show-Status
} elseif ($Update) {
    if (-not (Test-EnvironmentFile)) {
        exit 1
    }
    Update-Production
} else {
    Write-Host "Usage: .\deploy-production.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Build      Build production Docker images" -ForegroundColor Gray
    Write-Host "  -Start      Start production services" -ForegroundColor Gray
    Write-Host "  -Stop       Stop production services" -ForegroundColor Gray
    Write-Host "  -Restart    Restart production services" -ForegroundColor Gray
    Write-Host "  -Logs       Show logs (use -Service <name> for specific service)" -ForegroundColor Gray
    Write-Host "  -Health     Check service health" -ForegroundColor Gray
    Write-Host "  -Status     Show service status" -ForegroundColor Gray
    Write-Host "  -Update     Pull, rebuild, and restart services" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\deploy-production.ps1 -Build" -ForegroundColor Gray
    Write-Host "  .\deploy-production.ps1 -Start" -ForegroundColor Gray
    Write-Host "  .\deploy-production.ps1 -Logs -Service backend" -ForegroundColor Gray
    Write-Host "  .\deploy-production.ps1 -Health" -ForegroundColor Gray
}

