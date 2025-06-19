# AMC Portal Backend Testing Guide

## 🚀 Quick Start

### 1. Setup Database and Install Dependencies

```bash
cd amc-portal-backend

# Install dependencies
npm install

# Setup PostgreSQL database (see DATABASE_SETUP.md)
# Then run:
npm run db:setup
npm run db:seed
```

### 2. Start the Backend Server

```bash
# Start development server
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

## 🧪 API Testing Methods

### Method 1: Using curl (Command Line)

#### Test Health Check

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "success": true,
  "message": "AMC Portal API is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

#### Test Login (Admin)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@amc-portal.com",
    "password": "admin123",
    "role": "admin"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "Admin User",
      "email": "admin@amc-portal.com",
      "role": "admin",
      "post": "System Administrator",
      "department": "IT Department"
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

#### Test Login (User)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@amc-portal.com",
    "password": "user123",
    "role": "user"
  }'
```

#### Test Get Tasks (replace YOUR_TOKEN with actual token)

```bash
curl -X GET http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Get Task Stats

```bash
curl -X GET http://localhost:3001/api/tasks/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Get Notifications

```bash
curl -X GET http://localhost:3001/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Method 2: Using Postman or Thunder Client

1. **Install Postman** or **Thunder Client** (VS Code extension)

2. **Import this collection:**

```json
{
  "name": "AMC Portal API",
  "requests": [
    {
      "name": "Health Check",
      "method": "GET",
      "url": "http://localhost:3001/health"
    },
    {
      "name": "Login Admin",
      "method": "POST",
      "url": "http://localhost:3001/api/auth/login",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "email": "admin@amc-portal.com",
        "password": "admin123",
        "role": "admin"
      }
    },
    {
      "name": "Login User",
      "method": "POST",
      "url": "http://localhost:3001/api/auth/login",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "email": "user@amc-portal.com",
        "password": "user123",
        "role": "user"
      }
    },
    {
      "name": "Get Profile",
      "method": "GET",
      "url": "http://localhost:3001/api/auth/me",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Get Tasks",
      "method": "GET",
      "url": "http://localhost:3001/api/tasks",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Get Task Stats",
      "method": "GET",
      "url": "http://localhost:3001/api/tasks/stats",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Get Notifications",
      "method": "GET",
      "url": "http://localhost:3001/api/notifications",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

### Method 3: Using Browser (for GET requests)

1. **Health Check**: http://localhost:3001/health
2. For protected endpoints, you'll need to include the Authorization header

## 🔗 Connect Frontend to Backend

### Update Frontend Environment

```bash
# In your frontend directory, create or update .env
cd ../  # Go back to frontend directory
echo 'VITE_API_BASE_URL=http://localhost:3001/api' > .env
echo 'VITE_WS_URL=ws://localhost:3001' >> .env
```

### Test Full Integration

1. **Start Backend**:

```bash
cd amc-portal-backend
npm run dev
```

2. **Start Frontend** (in separate terminal):

```bash
cd ../  # Your frontend directory
npm run dev
```

3. **Test Login Flow**:
   - Go to http://localhost:8080
   - Try logging in with:
     - **Admin**: admin@amc-portal.com / admin123
     - **User**: user@amc-portal.com / user123

## 📊 Verify Database Data

### Check Database Tables

```bash
# Connect to database
psql -h localhost -p 5432 -U postgres -d amc_portal

# Check tables
\dt

# Check users
SELECT id, name, email, role FROM users;

# Check tasks
SELECT id, title, category, status, priority FROM tasks;

# Check notifications
SELECT id, title, type, is_read, user_id FROM notifications;
```

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**:

   - Make sure PostgreSQL is running
   - Check credentials in `.env` file
   - Verify database exists: `createdb amc_portal`

2. **Port Already in Use**:

   - Change PORT in `.env` file
   - Kill existing process: `lsof -ti:3001 | xargs kill -9`

3. **CORS Error in Frontend**:

   - Check FRONTEND_URL in backend `.env`
   - Make sure both servers are running

4. **Authentication Issues**:
   - Check if JWT_SECRET is set in `.env`
   - Verify token is included in Authorization header

## ✅ Success Indicators

You'll know the backend is working when:

1. ✅ Health check returns success
2. ✅ Login returns JWT tokens
3. ✅ Protected endpoints return data (not 401/403)
4. ✅ Frontend can connect and authenticate
5. ✅ Database queries return expected data
6. ✅ WebSocket connections are established

## 📈 Performance Testing

### Load Testing with Artillery

```bash
npm install -g artillery

# Create test script
cat > load-test.yml << EOF
config:
  target: http://localhost:3001
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health Check"
    requests:
      - get:
          url: "/health"
EOF

# Run load test
artillery run load-test.yml
```

## 🔍 Monitoring

### View Logs

```bash
# In development, logs appear in console
# For production, consider using PM2:
npm install -g pm2
pm2 start src/server.js --name amc-backend
pm2 logs amc-backend
```

## 🧪 Automated Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

This comprehensive testing guide ensures you can verify every aspect of the backend functionality!
