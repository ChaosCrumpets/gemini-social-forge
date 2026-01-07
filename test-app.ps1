# C.A.L. Application Testing Script (PowerShell)
# This script helps you test the application locally

Write-Host "🚀 C.A.L. Application Testing Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env.local exists
Write-Host "📋 Step 1: Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found" -ForegroundColor Yellow
    if (Test-Path ".env.local.example") {
        Write-Host "📝 Creating .env.local from .env.local.example..." -ForegroundColor Yellow
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "⚠️  Please edit .env.local and add your:" -ForegroundColor Yellow
        Write-Host "   - DATABASE_URL"
        Write-Host "   - GEMINI_API_KEY"
        Write-Host "   - JWT_SECRET"
        Write-Host "   - SESSION_SECRET"
        Write-Host ""
        Read-Host "Press Enter after you've configured .env.local"
    } else {
        Write-Host "❌ .env.local.example not found. Cannot proceed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
}

# Step 2: Check if node_modules exists
Write-Host ""
Write-Host "📦 Step 2: Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Dependencies not installed" -ForegroundColor Yellow
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Step 3: Check if Docker is running and database is up
Write-Host ""
Write-Host "🗄️  Step 3: Checking database..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null | Select-String "cal_postgres"
if ($dockerRunning) {
    Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL container not running" -ForegroundColor Yellow
    Write-Host "🐳 Starting PostgreSQL container..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host "✅ Database should be ready" -ForegroundColor Green
}

# Step 4: Run database migrations
Write-Host ""
Write-Host "🔄 Step 4: Running database migrations..." -ForegroundColor Yellow
npm run db:push
Write-Host "✅ Database migrations complete" -ForegroundColor Green

# Step 5: Type check
Write-Host ""
Write-Host "🔍 Step 5: Type checking..." -ForegroundColor Yellow
npm run check
Write-Host "✅ Type check passed" -ForegroundColor Green

# Step 6: Summary
Write-Host ""
Write-Host "🎯 Step 6: Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the app, run one of these commands:" -ForegroundColor Cyan
Write-Host "  • npm run dev          (combined server, Replit style)" -ForegroundColor White
Write-Host "  • npm run dev:local    (separate server + client, requires concurrently)" -ForegroundColor White
Write-Host "  • npm run dev:server   (backend only on port 3001)" -ForegroundColor White
Write-Host "  • npm run dev:client   (frontend only on port 5173)" -ForegroundColor White
Write-Host ""
Write-Host "Then open http://localhost:5173 (or port 5000 if using npm run dev)" -ForegroundColor Cyan
Write-Host ""

