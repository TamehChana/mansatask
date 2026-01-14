# Deployment Script for GitHub, Vercel, and Render
# This script helps prepare and deploy the Payment Link Platform

param(
    [switch]$Check,
    [switch]$Prepare,
    [switch]$GitHub,
    [switch]$Status
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Link Platform - Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    Write-Host ""
    
    $allGood = $true
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Git not found. Please install Git." -ForegroundColor Red
        $allGood = $false
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not found. Please install Node.js." -ForegroundColor Red
        $allGood = $false
    }
    
    # Check if .gitignore exists
    if (Test-Path ".gitignore") {
        Write-Host "✅ .gitignore exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .gitignore not found" -ForegroundColor Yellow
    }
    
    # Check if .env files are ignored
    if (Test-Path ".gitignore") {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        if ($gitignoreContent -match "\.env") {
            Write-Host "✅ .env files are in .gitignore" -ForegroundColor Green
        } else {
            Write-Host "⚠️  .env files may not be ignored" -ForegroundColor Yellow
        }
    }
    
    # Check if repository is initialized
    if (Test-Path ".git") {
        Write-Host "✅ Git repository initialized" -ForegroundColor Green
        
        # Check remote
        try {
            $remote = git remote get-url origin 2>$null
            if ($remote) {
                Write-Host "✅ Git remote configured: $remote" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Git remote not configured" -ForegroundColor Yellow
                Write-Host "   Run: git remote add origin <your-repo-url>" -ForegroundColor Gray
            }
        } catch {
            Write-Host "⚠️  Git remote not configured" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Git repository not initialized" -ForegroundColor Yellow
        Write-Host "   Run: git init" -ForegroundColor Gray
    }
    
    Write-Host ""
    return $allGood
}

# Prepare for deployment
function Prepare-Deployment {
    Write-Host "Preparing for deployment..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
        Write-Host $status -ForegroundColor Gray
        Write-Host ""
        $response = Read-Host "Do you want to commit these changes? (y/n)"
        if ($response -eq 'y') {
            git add .
            $message = Read-Host "Enter commit message"
            if (-not $message) {
                $message = "Prepare for deployment"
            }
            git commit -m $message
            Write-Host "✅ Changes committed" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ No uncommitted changes" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Check if .env files exist and warn
    $envFiles = @(".env", ".env.local", ".env.production", "backend/.env", "frontend/.env.local")
    foreach ($file in $envFiles) {
        if (Test-Path $file) {
            Write-Host "⚠️  Found: $file" -ForegroundColor Yellow
            Write-Host "   Make sure this is in .gitignore!" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "✅ Ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Push to GitHub: git push origin main" -ForegroundColor Gray
    Write-Host "2. Connect to Vercel (frontend)" -ForegroundColor Gray
    Write-Host "3. Connect to Render (backend)" -ForegroundColor Gray
    Write-Host "4. Configure environment variables" -ForegroundColor Gray
    Write-Host "5. Deploy!" -ForegroundColor Gray
}

# Push to GitHub
function Push-GitHub {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if remote exists
    try {
        $remote = git remote get-url origin 2>$null
        if (-not $remote) {
            Write-Host "❌ Git remote not configured" -ForegroundColor Red
            Write-Host "   Run: git remote add origin <your-repo-url>" -ForegroundColor Gray
            return
        }
        
        Write-Host "Remote: $remote" -ForegroundColor Gray
        Write-Host ""
        
        # Check current branch
        $branch = git branch --show-current
        Write-Host "Current branch: $branch" -ForegroundColor Gray
        
        # Push
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push -u origin $branch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "1. Go to Vercel and connect your repository" -ForegroundColor Gray
            Write-Host "2. Go to Render and connect your repository" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Show deployment status
function Show-Status {
    Write-Host "Deployment Status" -ForegroundColor Cyan
    Write-Host ""
    
    # Git status
    Write-Host "Git Status:" -ForegroundColor Yellow
    if (Test-Path ".git") {
        $branch = git branch --show-current
        $remote = git remote get-url origin 2>$null
        
        Write-Host "  Branch: $branch" -ForegroundColor Gray
        if ($remote) {
            Write-Host "  Remote: $remote" -ForegroundColor Gray
        } else {
            Write-Host "  Remote: Not configured" -ForegroundColor Yellow
        }
        
        $status = git status --porcelain
        if ($status) {
            Write-Host "  Uncommitted changes: Yes" -ForegroundColor Yellow
        } else {
            Write-Host "  Uncommitted changes: No" -ForegroundColor Green
        }
    } else {
        Write-Host "  Git repository not initialized" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # Environment files check
    Write-Host "Environment Files:" -ForegroundColor Yellow
    $envFiles = @(".env", ".env.local", ".env.production", "backend/.env", "frontend/.env.local")
    $found = $false
    foreach ($file in $envFiles) {
        if (Test-Path $file) {
            Write-Host "  ⚠️  $file exists" -ForegroundColor Yellow
            $found = $true
        }
    }
    if (-not $found) {
        Write-Host "  ✅ No .env files found (good for git)" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Build status
    Write-Host "Build Status:" -ForegroundColor Yellow
    if (Test-Path "backend/dist") {
        Write-Host "  ✅ Backend built" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Backend not built" -ForegroundColor Yellow
    }
    
    if (Test-Path "frontend/.next") {
        Write-Host "  ✅ Frontend built" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Frontend not built (will build on deploy)" -ForegroundColor Gray
    }
}

# Main execution
if ($Check) {
    if (-not (Test-Prerequisites)) {
        Write-Host "❌ Prerequisites check failed. Please fix issues above." -ForegroundColor Red
        exit 1
    }
} elseif ($Prepare) {
    Prepare-Deployment
} elseif ($GitHub) {
    Push-GitHub
} elseif ($Status) {
    Show-Status
} else {
    Write-Host "Usage: .\deploy-to-production.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Check      Check prerequisites" -ForegroundColor Gray
    Write-Host "  -Prepare    Prepare for deployment" -ForegroundColor Gray
    Write-Host "  -GitHub     Push to GitHub" -ForegroundColor Gray
    Write-Host "  -Status     Show deployment status" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\deploy-to-production.ps1 -Check" -ForegroundColor Gray
    Write-Host "  .\deploy-to-production.ps1 -Prepare" -ForegroundColor Gray
    Write-Host "  .\deploy-to-production.ps1 -GitHub" -ForegroundColor Gray
    Write-Host ""
    Write-Host "For detailed instructions, see:" -ForegroundColor Yellow
    Write-Host "  GITHUB_VERCEL_RENDER_DEPLOYMENT.md" -ForegroundColor Gray
}


