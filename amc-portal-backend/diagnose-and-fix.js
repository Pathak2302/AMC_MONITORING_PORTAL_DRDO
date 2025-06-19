#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 AMC Portal Backend Diagnosis and Fix");
console.log("======================================");

// Check if required files exist
const requiredFiles = [
  "src/config/database.js",
  "src/models/User.js",
  "src/models/Task.js",
  "src/models/Notification.js",
  "src/scripts/setupDatabase.js",
  "src/scripts/seedDatabase.js",
  ".env",
];

console.log("📁 Checking required files...");
let missingFiles = [];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.log("\n❌ Missing files detected:");
  missingFiles.forEach((file) => console.log(`   - ${file}`));
  console.log("\n💡 Please ensure all backend files are created properly.");
  process.exit(1);
}

console.log("\n📦 Checking package.json...");
const packagePath = path.join(__dirname, "package.json");
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  console.log(`✅ Package name: ${pkg.name}`);
  console.log(`✅ Version: ${pkg.version}`);
  console.log(`✅ Type: ${pkg.type}`);
} else {
  console.log("❌ package.json not found");
  process.exit(1);
}

console.log("\n🔧 Environment check...");
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  if (envContent.includes("DB_HOST")) {
    console.log("✅ .env file contains database configuration");
  } else {
    console.log("⚠️  .env file missing database configuration");
  }
} else {
  console.log("❌ .env file not found");
}

console.log("\n🔍 Checking Node.js version...");
console.log(`✅ Node.js version: ${process.version}`);

if (parseInt(process.version.slice(1)) < 18) {
  console.log("⚠️  Node.js 18+ recommended for ES modules");
}

console.log("\n🗄️  Testing database connection...");

// Dynamic import for database connection
try {
  const { query, closePool } = await import("./src/config/database.js");

  try {
    const result = await query("SELECT NOW() as current_time");
    console.log("✅ Database connection successful!");
    console.log(`📅 Current time: ${result.rows[0].current_time}`);

    // Check if tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tables.rows.length > 0) {
      console.log("📋 Existing tables:");
      tables.rows.forEach((row) => console.log(`   - ${row.table_name}`));
    } else {
      console.log("⚠️  No tables found. Database setup needed.");
    }

    await closePool();
  } catch (dbError) {
    console.error("❌ Database connection failed:", dbError.message);

    if (dbError.code === "ECONNREFUSED") {
      console.log("\n🔧 PostgreSQL is not running. Start it with:");
      console.log(
        "Docker: docker run --name amc-postgres -e POSTGRES_DB=amc_portal -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15",
      );
    }

    if (dbError.code === "3D000") {
      console.log("\n🗄️  Database doesn't exist. Create it with:");
      console.log("createdb amc_portal");
    }

    await closePool();
  }
} catch (importError) {
  console.error("❌ Failed to import database module:", importError.message);
  console.log(
    "💡 This might be an ES modules issue. Check your Node.js version and package.json configuration.",
  );
}

console.log("\n✅ Diagnosis complete!");
console.log("\n🚀 Next steps:");
console.log("1. Ensure PostgreSQL is running");
console.log("2. Run: npm run db:setup");
console.log("3. Run: npm run db:seed");
console.log("4. Run: npm run dev");
