#!/bin/bash

# C.A.L. Application Testing Script
# This script helps you test the application locally

set -e

echo "🚀 C.A.L. Application Testing Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if .env.local exists
echo "📋 Step 1: Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    if [ -f ".env.local.example" ]; then
        echo "📝 Creating .env.local from .env.local.example..."
        cp .env.local.example .env.local
        echo -e "${YELLOW}⚠️  Please edit .env.local and add your:${NC}"
        echo "   - DATABASE_URL"
        echo "   - GEMINI_API_KEY"
        echo "   - JWT_SECRET"
        echo "   - SESSION_SECRET"
        echo ""
        echo "Press Enter after you've configured .env.local..."
        read
    else
        echo -e "${RED}❌ .env.local.example not found. Cannot proceed.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# Step 2: Check if node_modules exists
echo ""
echo "📦 Step 2: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    echo "📥 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Step 3: Check if Docker is running and database is up
echo ""
echo "🗄️  Step 3: Checking database..."
if command -v docker &> /dev/null; then
    if docker ps | grep -q "cal_postgres"; then
        echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL container not running${NC}"
        echo "🐳 Starting PostgreSQL container..."
        docker-compose up -d
        echo "⏳ Waiting for database to be ready..."
        sleep 5
        echo -e "${GREEN}✅ Database should be ready${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found. Make sure PostgreSQL is running locally.${NC}"
fi

# Step 4: Run database migrations
echo ""
echo "🔄 Step 4: Running database migrations..."
npm run db:push
echo -e "${GREEN}✅ Database migrations complete${NC}"

# Step 5: Type check
echo ""
echo "🔍 Step 5: Type checking..."
npm run check
echo -e "${GREEN}✅ Type check passed${NC}"

# Step 6: Start the application
echo ""
echo "🎯 Step 6: Starting application..."
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the app, run one of these commands:"
echo "  • npm run dev          (combined server, Replit style)"
echo "  • npm run dev:local    (separate server + client, requires concurrently)"
echo "  • npm run dev:server   (backend only on port 3001)"
echo "  • npm run dev:client   (frontend only on port 5173)"
echo ""
echo "Then open http://localhost:5173 (or port 5000 if using npm run dev)"
echo ""

