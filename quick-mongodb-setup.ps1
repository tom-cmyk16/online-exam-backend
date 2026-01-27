# Quick MongoDB Setup Script for Windows
# Run this script as Administrator

Write-Host "🚀 MongoDB Quick Setup for Windows" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ This script needs to run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create MongoDB directories
Write-Host "📁 Creating MongoDB directories..." -ForegroundColor Yellow
$mongoPath = "C:\Program Files\MongoDB"
$dataPath = "C:\data\db"
$logPath = "C:\data\log"

try {
    New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
    New-Item -ItemType Directory -Force -Path $logPath | Out-Null
    Write-Host "✅ Directories created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create directories: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if MongoDB is already installed
if (Test-Path "$mongoPath\Server\*\bin\mongod.exe") {
    Write-Host "✅ MongoDB is already installed!" -ForegroundColor Green
    
    # Try to start the service
    try {
        Start-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ MongoDB service not found or failed to start" -ForegroundColor Yellow
        Write-Host "You may need to install MongoDB as a service manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ MongoDB not found in standard location" -ForegroundColor Red
    Write-Host "📥 Please download MongoDB manually from:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    Write-Host "" 
    Write-Host "Installation steps:" -ForegroundColor Yellow
    Write-Host "1. Download the .msi installer" -ForegroundColor White
    Write-Host "2. Run as Administrator" -ForegroundColor White
    Write-Host "3. Choose 'Complete' installation" -ForegroundColor White
    Write-Host "4. Check 'Install MongoDB as a Service'" -ForegroundColor White
    Write-Host "5. Check 'Run service as Network Service user'" -ForegroundColor White
    
    # Open download page
    Start-Process "https://www.mongodb.com/try/download/community"
}

# Test connection
Write-Host "" 
Write-Host "🔍 Testing MongoDB connection..." -ForegroundColor Yellow

try {
    $testConnection = Test-NetConnection -ComputerName "localhost" -Port 27017 -WarningAction SilentlyContinue
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✅ MongoDB is running on port 27017!" -ForegroundColor Green
        Write-Host "🎉 Your Node.js app should now connect successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB is not running on port 27017" -ForegroundColor Red
        Write-Host "💡 Try starting the MongoDB service:" -ForegroundColor Yellow
        Write-Host "   net start MongoDB" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to test connection: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "" 
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. If MongoDB is not installed, download and install it" -ForegroundColor White
Write-Host "2. Make sure MongoDB service is running" -ForegroundColor White
Write-Host "3. Restart your Node.js server" -ForegroundColor White
Write-Host "4. You should see: '✅ MongoDB Connected Successfully!'" -ForegroundColor White

Read-Host "Press Enter to exit"