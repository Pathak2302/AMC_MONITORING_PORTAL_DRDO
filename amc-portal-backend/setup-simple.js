const { Client } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "amc_portal",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
};

async function setupAndSeed() {
  const client = new Client(dbConfig);

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    // Create tables
    console.log("🗄️  Creating tables...");

    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin', 'user')) NOT NULL,
        post VARCHAR(100),
        department VARCHAR(100),
        avatar_url VARCHAR(255),
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(20) CHECK (category IN ('daily', 'weekly', 'monthly')) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('pending', 'in-progress', 'completed', 'overdue')) DEFAULT 'pending',
        priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        assigned_to UUID REFERENCES users(id),
        assigned_by UUID REFERENCES users(id),
        due_date TIMESTAMP,
        estimated_time INTEGER,
        actual_time INTEGER,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system-alert',
        priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        user_id UUID REFERENCES users(id),
        is_read BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tables created successfully!");

    // Check if users already exist
    const userCount = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log("⚠️  Users already exist. Skipping seed data...");
      return;
    }

    // Seed data
    console.log("🌱 Creating seed data...");

    // Create admin user
    const adminPasswordHash = await bcrypt.hash("admin123", 12);
    const adminResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, post, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role`,
      [
        "Admin User",
        "admin@amc-portal.com",
        adminPasswordHash,
        "admin",
        "System Administrator",
        "IT Department",
      ],
    );

    const admin = adminResult.rows[0];
    console.log("✅ Created admin user:", admin.email);

    // Create regular user
    const userPasswordHash = await bcrypt.hash("user123", 12);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, post, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role`,
      [
        "John Doe",
        "user@amc-portal.com",
        userPasswordHash,
        "user",
        "Maintenance Technician",
        "Operations",
      ],
    );

    const user = userResult.rows[0];
    console.log("✅ Created regular user:", user.email);

    // Create sample tasks
    const task1 = await client.query(
      `INSERT INTO tasks (title, description, category, priority, assigned_to, assigned_by, due_date, estimated_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title`,
      [
        "Daily Equipment Inspection",
        "Inspect all critical equipment for any signs of wear or damage",
        "daily",
        "high",
        user.id,
        admin.id,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        60,
      ],
    );

    await client.query(
      `INSERT INTO tasks (title, description, category, priority, assigned_to, assigned_by, due_date, estimated_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        "Weekly Safety Check",
        "Conduct comprehensive safety inspection of the facility",
        "weekly",
        "medium",
        user.id,
        admin.id,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        120,
      ],
    );

    await client.query(
      `INSERT INTO tasks (title, description, category, priority, assigned_to, assigned_by, due_date, estimated_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        "Monthly Preventive Maintenance",
        "Perform scheduled preventive maintenance on all machinery",
        "monthly",
        "high",
        user.id,
        admin.id,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        240,
      ],
    );

    console.log("✅ Created sample tasks");

    // Create sample notifications
    await client.query(
      `INSERT INTO notifications (title, message, type, priority, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        "Welcome to AMC Portal",
        "Welcome to the Asset Management & Maintenance Portal. Start by reviewing your assigned tasks.",
        "system-alert",
        "medium",
        user.id,
      ],
    );

    await client.query(
      `INSERT INTO notifications (title, message, type, priority, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        "New Task Assigned",
        `You have been assigned a new task: ${task1.rows[0].title}`,
        "task-assigned",
        "high",
        user.id,
        JSON.stringify({
          taskId: task1.rows[0].id,
          taskTitle: task1.rows[0].title,
        }),
      ],
    );

    console.log("✅ Created sample notifications");

    console.log("\n🎉 Database setup and seeding completed successfully!");
    console.log("\n📋 Test Accounts Created:");
    console.log("┌─────────────────────────────────────────────┐");
    console.log("│ ADMIN ACCOUNT                               │");
    console.log("├─────────────────────────────────────────────┤");
    console.log("│ Email:    admin@amc-portal.com              │");
    console.log("│ Password: admin123                          │");
    console.log("│ Role:     admin                             │");
    console.log("├─────────────────────────────────────────────┤");
    console.log("│ USER ACCOUNT                                │");
    console.log("├─────────────────────────────────────────────┤");
    console.log("│ Email:    user@amc-portal.com               │");
    console.log("│ Password: user123                           │");
    console.log("│ Role:     user                              │");
    console.log("└─────────────────────────────────────────────┘");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(
      "💡 Make sure PostgreSQL is running and credentials in .env are correct",
    );

    if (error.code === "ECONNREFUSED") {
      console.log("\n🔧 Start PostgreSQL with:");
      console.log(
        "Docker: docker run --name amc-postgres -e POSTGRES_DB=amc_portal -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15",
      );
    }
  } finally {
    await client.end();
  }
}

setupAndSeed();
