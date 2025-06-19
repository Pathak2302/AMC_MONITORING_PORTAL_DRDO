# Fix Windows Error Guide

## 🐛 Error You're Experiencing

```
Error: Cannot find module 'C:\Users\HP\Desktop\clone\AMC-monitoring-portal\amc-portal-backend\src\scripts\seedDatabase.js'
```

## 🔧 Quick Fix Options

### Option 1: Use the Simple Setup Script (Recommended)

```bash
# This bypasses ES modules issues
npm run db:setup-simple
```

This will:

- ✅ Create all database tables
- ✅ Add sample data
- ✅ Create test accounts
- ✅ Work with any Node.js version

### Option 2: Test Database Connection First

```bash
# Test if PostgreSQL is accessible
npm run db:test
```

### Option 3: Run Diagnosis

```bash
# Check what's wrong with your setup
npm run diagnose
```

### Option 4: Manual PowerShell Setup

If the above doesn't work, run these commands in PowerShell:

```powershell
# 1. Check Node.js version
node --version

# 2. Check if PostgreSQL is running
Test-NetConnection -ComputerName localhost -Port 5432

# 3. Start PostgreSQL with Docker
docker run --name amc-postgres -e POSTGRES_DB=amc_portal -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# 4. Wait 10 seconds, then run the simple setup
Start-Sleep -Seconds 10
npm run db:setup-simple
```

## 🎯 Expected Success Output

When it works, you should see:

```
🔌 Connecting to database...
✅ Connected to PostgreSQL
🗄️  Creating tables...
✅ Tables created successfully!
🌱 Creating seed data...
✅ Created admin user: admin@amc-portal.com
✅ Created regular user: user@amc-portal.com
✅ Created sample tasks
✅ Created sample notifications

🎉 Database setup and seeding completed successfully!

📋 Test Accounts Created:
┌─────────────────────────────────────────────┐
│ ADMIN ACCOUNT                               │
├─────────────────────────────────────────────┤
│ Email:    admin@amc-portal.com              │
│ Password: admin123                          │
│ Role:     admin                             │
├─────────────────────────────────────────────┤
│ USER ACCOUNT                                │
├─────────────────────────────────────────────┤
│ Email:    user@amc-portal.com               │
│ Password: user123                           │
│ Role:     user                              │
└─────────────────────────────────────────────┘
```

## 🚀 Next Steps After Success

```bash
# Start the backend server
npm run dev

# Test the API (in new terminal)
npm run test:api

# Start frontend (in another terminal)
cd ../
npm run dev
```

## 🔍 Common Issues and Solutions

### Issue 1: PostgreSQL Not Running

**Error:** `ECONNREFUSED`

**Solution:**

```bash
# Start PostgreSQL with Docker
docker run --name amc-postgres -e POSTGRES_DB=amc_portal -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

### Issue 2: Database Doesn't Exist

**Error:** `database "amc_portal" does not exist`

**Solution:** The simple setup script creates it automatically, or run:

```bash
createdb amc_portal
```

### Issue 3: Permission Denied

**Error:** `permission denied`

**Solution:** Run PowerShell as Administrator

### Issue 4: Port Already in Use

**Error:** `port 5432 already in use`

**Solution:**

```bash
# Check what's using the port
netstat -ano | findstr :5432

# Use existing PostgreSQL or change port in .env
```

## 🆘 Still Having Issues?

If none of the above work, run this complete diagnostic:

```bash
# Check everything
npm run diagnose

# Check Node.js version
node --version

# Check if files exist
dir src\scripts\

# Check package.json
type package.json | findstr "type"
```

Then share the output for further assistance.

## ✅ Verification

Once setup works, verify by:

1. ✅ Login at http://localhost:8080
2. ✅ Use: admin@amc-portal.com / admin123
3. ✅ See real data (no "Demo Mode")
4. ✅ Tasks and notifications load
