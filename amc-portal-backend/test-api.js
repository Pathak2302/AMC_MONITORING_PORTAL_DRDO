#!/usr/bin/env node

// Simple API Test Script for AMC Portal Backend
// Usage: node test-api.js

const API_BASE = "http://localhost:3001";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (response.ok) {
      log(colors.green, `✅ ${name}: PASS (${response.status})`);
      return { success: true, data };
    } else {
      log(colors.red, `❌ ${name}: FAIL (${response.status})`);
      console.log("   Response:", data);
      return { success: false, data };
    }
  } catch (error) {
    log(colors.red, `❌ ${name}: ERROR`);
    console.log("   Error:", error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log(colors.cyan, "\n🧪 AMC Portal Backend API Tests");
  log(colors.cyan, "================================\n");

  let adminToken = null;
  let userToken = null;

  // Test 1: Health Check
  await testEndpoint("Health Check", "/health");

  // Test 2: Admin Login
  const adminLogin = await testEndpoint("Admin Login", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@amc-portal.com",
      password: "admin123",
      role: "admin",
    }),
  });

  if (adminLogin.success) {
    adminToken = adminLogin.data.data.accessToken;
    log(colors.blue, "   💾 Admin token saved");
  }

  // Test 3: User Login
  const userLogin = await testEndpoint("User Login", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "user@amc-portal.com",
      password: "user123",
      role: "user",
    }),
  });

  if (userLogin.success) {
    userToken = userLogin.data.data.accessToken;
    log(colors.blue, "   💾 User token saved");
  }

  // Test 4: Get Admin Profile
  if (adminToken) {
    await testEndpoint("Admin Profile", "/api/auth/me", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // Test 5: Get User Profile
  if (userToken) {
    await testEndpoint("User Profile", "/api/auth/me", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
  }

  // Test 6: Get Tasks (Admin)
  if (adminToken) {
    await testEndpoint("Get Tasks (Admin)", "/api/tasks", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // Test 7: Get Tasks (User)
  if (userToken) {
    await testEndpoint("Get Tasks (User)", "/api/tasks", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
  }

  // Test 8: Get Task Stats (Admin)
  if (adminToken) {
    await testEndpoint("Task Stats (Admin)", "/api/tasks/stats", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // Test 9: Get Task Stats (User)
  if (userToken) {
    await testEndpoint("Task Stats (User)", "/api/tasks/stats", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
  }

  // Test 10: Get Notifications (User)
  if (userToken) {
    await testEndpoint("Get Notifications", "/api/notifications", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
  }

  // Test 11: Get Unread Count
  if (userToken) {
    await testEndpoint(
      "Unread Notifications Count",
      "/api/notifications/unread-count",
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );
  }

  // Test 12: Create Task (Admin)
  if (adminToken) {
    await testEndpoint("Create Task", "/api/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: "Test Task from API",
        description: "This task was created via API test",
        category: "daily",
        priority: "medium",
        estimatedTime: 30,
      }),
    });
  }

  // Test 13: Unauthorized Access
  await testEndpoint("Unauthorized Access", "/api/tasks");

  log(colors.cyan, "\n🏁 Tests completed!");
  log(colors.yellow, "\n📋 Next steps:");
  console.log("1. Check that your PostgreSQL database is running");
  console.log("2. Ensure you've run: npm run db:setup && npm run db:seed");
  console.log("3. Start the backend: npm run dev");
  console.log("4. Connect your frontend to http://localhost:3001/api");
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === "undefined") {
  console.error("❌ This script requires Node.js 18+ (for fetch API)");
  console.log("💡 Alternative: Use curl commands from TESTING_GUIDE.md");
  process.exit(1);
}

runTests().catch((error) => {
  console.error("❌ Test script error:", error);
  process.exit(1);
});
