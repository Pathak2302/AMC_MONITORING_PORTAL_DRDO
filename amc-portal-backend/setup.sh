#!/bin/bash

# AMC Portal Backend Setup Script
set -e

echo "🚀 AMC Portal Backend Setup"
echo "==========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ is required. You have Node.js $NODE_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if PostgreSQL is running
if ! nc -z localhost 5432; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running on localhost:5432${NC}"
    echo "Please ensure PostgreSQL is installed and running, or use Docker:"
    echo ""
    echo "Docker option:"
    echo "docker run --name amc-postgres -e POSTGRES_DB=amc_portal -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Setup database
echo -e "${BLUE}🗄️  Setting up database...${NC}"
node src/scripts/setupDatabase.js

# Seed database
echo -e "${BLUE}🌱 Seeding database with sample data...${NC}"
node src/scripts/seedDatabase.js

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Test Accounts:${NC}"
echo "┌─────────────────────────────────────────────┐"
echo "│ Admin: admin@amc-portal.com / admin123      │"
echo "│ User:  user@amc-portal.com / user123        │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo -e "${YELLOW}🚀 To start the server:${NC}"
echo "npm run dev"
echo ""
echo -e "${YELLOW}🧪 To test the API:${NC}"
echo "node test-api.js"
echo ""
echo -e "${YELLOW}📚 For detailed testing guide:${NC}"
echo "cat TESTING_GUIDE.md"
