#!/usr/bin/env pwsh
# FAQ Chatbot Admin Dashboard Setup Script for Windows
# This script sets up the complete development environment

param(
    [switch]$SkipPython,
    [switch]$SkipDependencies,
    [switch]$Production
)

$ErrorActionPreference = "Stop"

# Colors for output
$Red = [Console]::ForegroundColor = "Red"
$Green = [Console]::ForegroundColor = "Green"
$Yellow = [Console]::ForegroundColor = "Yellow"
$Blue = [Console]::ForegroundColor = "Blue"
$White = [Console]::ForegroundColor = "White"

function Write-ColorOutput($ForegroundColor, $Message) {
    $currentColor = [Console]::ForegroundColor
    [Console]::ForegroundColor = $ForegroundColor
    Write-Output $Message
    [Console]::ForegroundColor = $currentColor
}

function Write-Header($Message) {
    Write-ColorOutput $Blue "============================================"
    Write-ColorOutput $Blue " $Message"
    Write-ColorOutput $Blue "============================================"
}

function Write-Success($Message) {
    Write-ColorOutput $Green "✅ $Message"
}

function Write-Warning($Message) {
    Write-ColorOutput $Yellow "⚠️  $Message"
}

function Write-Error($Message) {
    Write-ColorOutput $Red "❌ $Message"
}

function Write-Info($Message) {
    Write-ColorOutput $White "ℹ️  $Message"
}

function Test-Command($Command) {
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

Write-Header "FAQ Chatbot Admin Dashboard Setup"

# Check prerequisites
Write-Info "Checking prerequisites..."

if (-not (Test-Command "node")) {
    Write-Error "Node.js is required but not installed."
    Write-Info "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
}

$nodeVersion = (node --version) -replace 'v', ''
$majorVersion = [int]($nodeVersion.Split('.')[0])
if ($majorVersion -lt 18) {
    Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
    exit 1
}
Write-Success "Node.js version $nodeVersion found"

if (-not (Test-Command "npm")) {
    Write-Error "npm is required but not installed."
    exit 1
}
Write-Success "npm found"

if (-not $SkipPython) {
    if (-not (Test-Command "python")) {
        Write-Error "Python is required but not installed."
        Write-Info "Please install Python 3.8+ from https://python.org/"
        exit 1
    }
    
    $pythonVersion = python --version
    Write-Success "$pythonVersion found"
    
    if (-not (Test-Command "pip")) {
        Write-Error "pip is required but not installed."
        exit 1
    }
    Write-Success "pip found"
}

# Setup workspace dependencies
if (-not $SkipDependencies) {
    Write-Header "Installing Workspace Dependencies"
    
    Write-Info "Installing root workspace dependencies..."
    npm install
    Write-Success "Root dependencies installed"
    
    # Setup backend
    Write-Info "Setting up admin backend..."
    Set-Location admin-backend
    
    Write-Info "Installing backend dependencies..."
    npm install
    Write-Success "Backend dependencies installed"
    
    Write-Info "Setting up backend environment..."
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Success "Backend .env file created from template"
        Write-Warning "Please review and update .env file with your configuration"
    }
    else {
        Write-Info "Backend .env file already exists"
    }
    
    # Create necessary directories
    $dirs = @("logs", "backups", "uploads")
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
            Write-Success "Created $dir directory"
        }
    }
    
    Set-Location ..
    
    # Setup frontend
    Write-Info "Setting up admin frontend..."
    Set-Location admin-frontend
    
    Write-Info "Installing frontend dependencies..."
    npm install
    Write-Success "Frontend dependencies installed"
    
    Write-Info "Setting up frontend environment..."
    if (-not (Test-Path ".env.local")) {
        $envContent = @"
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
"@
        $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Success "Frontend .env.local file created"
    }
    else {
        Write-Info "Frontend .env.local file already exists"
    }
    
    Set-Location ..
    
    # Setup Python dependencies
    if (-not $SkipPython) {
        Write-Info "Setting up Python bot dependencies..."
        Set-Location python-bot
        
        Write-Info "Installing Python dependencies..."
        pip install -r requirements.txt
        Write-Success "Python dependencies installed"
        
        Set-Location ..
    }
}

# Database setup
Write-Header "Database Setup"

if ($Production) {
    Write-Info "Production mode: Using PostgreSQL"
    Write-Warning "Make sure PostgreSQL is installed and configured"
    Write-Info "Update DATABASE_URL in admin-backend/.env with your PostgreSQL connection string"
}
else {
    Write-Info "Development mode: Using SQLite"
    Write-Success "SQLite will be automatically created when backend starts"
}

# Generate JWT secret if needed
Write-Header "Security Configuration"

$envFile = "admin-backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production") {
        Write-Info "Generating secure JWT secret..."
        $jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
        $envContent = $envContent -replace "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production", "JWT_SECRET=$jwtSecret"
        $envContent | Out-File -FilePath $envFile -Encoding UTF8 -NoNewline
        Write-Success "JWT secret generated and updated in .env file"
    }
}

# File permissions check
Write-Header "File Permissions Check"

$dataPath = "python-bot\data"
if (Test-Path $dataPath) {
    try {
        $testFile = "$dataPath\test-write.tmp"
        "test" | Out-File -FilePath $testFile
        Remove-Item $testFile
        Write-Success "FAQ data directory is writable"
    }
    catch {
        Write-Error "FAQ data directory is not writable: $dataPath"
        Write-Info "Please check file permissions"
    }
}
else {
    Write-Warning "FAQ data directory not found: $dataPath"
}

# Verify setup
Write-Header "Verifying Setup"

$checks = @(
    @{ Path = "package.json"; Description = "Root workspace configuration" },
    @{ Path = "admin-backend\package.json"; Description = "Backend package configuration" },
    @{ Path = "admin-frontend\package.json"; Description = "Frontend package configuration" },
    @{ Path = "admin-backend\.env"; Description = "Backend environment configuration" },
    @{ Path = "admin-frontend\.env.local"; Description = "Frontend environment configuration" },
    @{ Path = "shared\types\index.ts"; Description = "Shared TypeScript types" }
)

$allGood = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Success $check.Description
    }
    else {
        Write-Error "Missing: $($check.Description) ($($check.Path))"
        $allGood = $false
    }
}

if (-not $SkipPython) {
    if (Test-Path "python-bot\app.py") {
        Write-Success "Python bot application"
    }
    else {
        Write-Error "Missing: Python bot application (python-bot\app.py)"
        $allGood = $false
    }
}

# Final instructions
Write-Header "Setup Complete!"

if ($allGood) {
    Write-Success "All components are properly configured"
    Write-Info ""
    Write-Info "🚀 To start the development environment:"
    Write-Info ""
    Write-Info "   Option 1 - Start all services:"
    Write-Info "   npm run dev"
    Write-Info ""
    Write-Info "   Option 2 - Start services individually:"
    Write-Info "   Terminal 1: npm run dev:python"
    Write-Info "   Terminal 2: npm run dev:backend" 
    Write-Info "   Terminal 3: npm run dev:frontend"
    Write-Info ""
    Write-Info "🌐 Access URLs:"
    Write-Info "   Admin Dashboard: http://localhost:3000"
    Write-Info "   Backend API: http://localhost:3001"
    Write-Info "   Python Chatbot: http://localhost:5000"
    Write-Info ""
    Write-Info "🔑 Default admin credentials:"
    Write-Info "   Username: admin"
    Write-Info "   Password: admin123"
    Write-Info ""
    
    if ($Production) {
        Write-Info "🐳 For production deployment:"
        Write-Info "   docker-compose up -d"
    }
    else {
        Write-Info "🐳 For Docker development:"
        Write-Info "   docker-compose -f docker-compose.dev.yml up"
    }
    
    Write-Info ""
    Write-Warning "Important Notes:"
    Write-Info "• Review and update environment variables in .env files"
    Write-Info "• Change default admin password after first login"
    Write-Info "• Check FAQ data files in python-bot/data/ directory"
    Write-Info "• Monitor logs in python-bot/bot.log for chatbot activity"
    
}
else {
    Write-Error "Setup completed with errors. Please fix the issues above."
    exit 1
}

Write-Info ""
Write-Success "Setup completed successfully! 🎉"
