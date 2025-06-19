@echo off
echo 🚀 AMC Portal Backend Setup
echo ===========================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Setup database
echo 🗄️ Setting up database...
node src/scripts/setupDatabase.js

REM Seed database
echo 🌱 Seeding database with sample data...
node src/scripts/seedDatabase.js

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Test Accounts:
echo ┌─────────────────────────────────────────────┐
echo │ Admin: admin@amc-portal.com / admin123      │
echo │ User:  user@amc-portal.com / user123        │
echo └──���──────────────────────────────────────────┘
echo.
echo 🚀 To start the server:
echo npm run dev
echo.
echo 🧪 To test the API:
echo node test-api.js
echo.
pause
