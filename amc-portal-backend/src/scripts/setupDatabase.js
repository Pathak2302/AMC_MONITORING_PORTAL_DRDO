import { query, closePool } from "../config/database.js";

const createTables = async () => {
  console.log("🚀 Setting up AMC Portal database...");

  try {
    // Enable UUID extension
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Users table
    await query(`
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
    await query(`
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
        estimated_time INTEGER, -- in minutes
        actual_time INTEGER,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // Notifications table
    await query(`
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

    // User activities table
    await query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        activity_type VARCHAR(50) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Equipment table
    await query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50),
        model VARCHAR(100),
        serial_number VARCHAR(100) UNIQUE,
        location VARCHAR(100),
        status VARCHAR(20) CHECK (status IN ('operational', 'maintenance', 'faulty')) DEFAULT 'operational',
        last_service_date TIMESTAMP,
        next_service_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Service records table
    await query(`
      CREATE TABLE IF NOT EXISTS service_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(20) CHECK (type IN ('routine', 'repair', 'replacement')),
        description TEXT,
        technician VARCHAR(100),
        cost DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Remarks table
    await query(`
      CREATE TABLE IF NOT EXISTS remarks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        task_id UUID REFERENCES tasks(id),
        message TEXT NOT NULL,
        type VARCHAR(20) CHECK (type IN ('feedback', 'issue', 'suggestion')) DEFAULT 'feedback',
        admin_response TEXT,
        responded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Task attachments table
    await query(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        type VARCHAR(20) CHECK (type IN ('photo', 'screenshot', 'report', 'document')),
        url VARCHAR(500) NOT NULL,
        name VARCHAR(255) NOT NULL,
        size INTEGER,
        uploaded_by UUID REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_activities_user_id ON user_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_type ON user_activities(activity_type);
      CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
    `);

    // Create triggers for updated_at timestamps
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log("✅ Database tables created successfully!");
    console.log("📋 Created tables:");
    console.log("   - users");
    console.log("   - tasks");
    console.log("   - notifications");
    console.log("   - user_activities");
    console.log("   - equipment");
    console.log("   - service_records");
    console.log("   - remarks");
    console.log("   - task_attachments");
    console.log("📈 Created indexes for better performance");
    console.log("⚡ Created triggers for automatic timestamps");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
};

createTables();
