# Complete AMC Portal Setup Guide (Error-Free)

## 🚀 Quick Setup (5 Steps)

### Step 1: Setup PostgreSQL Database

**Option A: Using Docker (Recommended)**

```bash
# Run PostgreSQL in Docker
docker run --name amc-postgres \
  -e POSTGRES_DB=amc_portal \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

**Option B: Local PostgreSQL Installation**

- Download from: https://www.postgresql.org/download/
- Install with default settings
- Create database: `createdb amc_portal`

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd amc-portal-backend

# Install dependencies
npm install

# Setup database tables
npm run db:setup

# Add sample data
npm run db:seed

# Start backend server
npm run dev
```

You should see:

```
🚀 AMC Portal Backend Server Started
================================
📍 Server running on port 3001
🌍 Environment: development
🔗 Health check: http://localhost:3001/health
📡 WebSocket enabled on port 3001
================================
```

### Step 3: Test Backend

```bash
# Test the API
node test-api.js
```

Expected output:

```
🧪 AMC Portal Backend API Tests
================================

✅ Health Check: PASS (200)
✅ Admin Login: PASS (200)
✅ User Login: PASS (200)
✅ Admin Profile: PASS (200)
✅ User Profile: PASS (200)
✅ Get Tasks (Admin): PASS (200)
✅ Get Tasks (User): PASS (200)
✅ Task Stats (Admin): PASS (200)
✅ Task Stats (User): PASS (200)
✅ Get Notifications: PASS (200)
✅ Unread Notifications Count: PASS (200)
✅ Create Task: PASS (201)
❌ Unauthorized Access: FAIL (401) [Expected]

🏁 Tests completed!
```

### Step 4: Frontend Integration

```bash
# Go back to frontend directory
cd ../

# The .env file is already created with correct settings:
# VITE_API_BASE_URL=http://localhost:3001/api
# VITE_WS_URL=ws://localhost:3001
# VITE_MOCK_MODE=false

# Start frontend server
npm run dev
```

### Step 5: Test Complete Integration

1. **Open browser**: http://localhost:8080
2. **Login with test accounts**:
   - **Admin**: admin@amc-portal.com / admin123
   - **User**: user@amc-portal.com / user123
3. **Verify**: No more "Demo Mode" banner, real data loads

## 🔧 Troubleshooting Common Issues

### Issue 1: Database Connection Error

**Symptoms:**

```
❌ Failed to connect to database: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

```bash
# Check if PostgreSQL is running
docker ps  # For Docker
# OR
sudo systemctl status postgresql  # For Linux
# OR
brew services list | grep postgres  # For macOS

# Restart PostgreSQL
docker start amc-postgres  # For Docker
# OR
sudo systemctl start postgresql  # For Linux
# OR
brew services start postgresql  # For macOS

# Check database exists
psql -h localhost -U postgres -l | grep amc_portal
```

### Issue 2: Port Already in Use

**Symptoms:**

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**

```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

### Issue 3: Frontend Still Shows "Demo Mode"

**Symptoms:**

- Demo Mode banner still visible
- Mock data still loading

**Solutions:**

```bash
# 1. Check .env file exists in frontend root
cat .env

# 2. Restart frontend server
npm run dev

# 3. Clear browser cache and localStorage
# In browser console:
localStorage.clear()
location.reload()

# 4. Check network tab for API calls to localhost:3001
```

### Issue 4: CORS Errors

**Symptoms:**

```
Access to fetch at 'http://localhost:3001/api/...' has been blocked by CORS policy
```

**Solutions:**

```bash
# 1. Check FRONTEND_URL in backend/.env
FRONTEND_URL=http://localhost:8080

# 2. Restart backend server
npm run dev

# 3. Ensure both servers are running on correct ports
```

### Issue 5: Authentication Errors

**Symptoms:**

```
❌ Admin Login: FAIL (401)
❌ User Login: FAIL (401)
```

**Solutions:**

```bash
# 1. Check if seed data exists
psql -h localhost -U postgres -d amc_portal -c "SELECT email, role FROM users;"

# 2. Re-seed database if empty
npm run db:seed

# 3. Check JWT_SECRET in backend/.env
JWT_SECRET=amc-portal-super-secret-jwt-key-development
```

## 🧪 Manual Testing Commands

### Test Individual Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amc-portal.com","password":"admin123","role":"admin"}'

# Get tasks (replace TOKEN with actual token)
curl -X GET http://localhost:3001/api/tasks \
  -H "Authorization: Bearer TOKEN"
```

### Check Database Data

```bash
# Connect to database
psql -h localhost -U postgres -d amc_portal

# Check tables
\dt

# Check users
SELECT id, name, email, role FROM users;

# Check tasks
SELECT id, title, category, status FROM tasks;

# Exit
\q
```

## 🎯 Success Verification Checklist

- ✅ Backend server starts without errors
- ✅ Database connection successful
- ✅ API test script passes all tests
- ✅ Frontend loads without "Demo Mode"
- ✅ Login works with test accounts
- ✅ Tasks and notifications load from database
- ✅ WebSocket connection established
- ✅ No CORS errors in browser console

## 📊 Production Deployment

### Environment Variables for Production

**Backend (.env):**

```bash
NODE_ENV=production
PORT=3001
DB_HOST=your-production-db-host
DB_NAME=amc_portal_prod
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=https://your-domain.com
```

**Frontend (.env.production):**

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_WS_URL=wss://api.your-domain.com
VITE_MOCK_MODE=false
VITE_NODE_ENV=production
```

### Build and Deploy

```bash
# Backend
cd amc-portal-backend
npm run build  # If you add build script
pm2 start src/server.js --name amc-backend

# Frontend
cd ../
npm run build
# Deploy dist/ folder to your hosting service
```

## 🔍 Monitoring

### Check Logs

```bash
# Backend logs
tail -f amc-portal-backend/logs/app.log

# PM2 logs (if using PM2)
pm2 logs amc-backend

# Docker logs (if using Docker)
docker logs amc-postgres
```

### Performance Monitoring

```bash
# Check database connections
psql -h localhost -U postgres -d amc_portal -c "SELECT count(*) FROM pg_stat_activity;"

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health
```

Your AMC Portal is now fully functional with a real backend! 🎉
