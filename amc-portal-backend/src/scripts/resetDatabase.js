import { query, closePool } from "../config/database.js";

const resetDatabase = async () => {
  console.log("🗑️  Resetting AMC Portal database...");

  try {
    // Drop all tables in correct order (considering foreign key constraints)
    const tables = [
      "task_attachments",
      "service_records",
      "remarks",
      "user_activities",
      "notifications",
      "tasks",
      "equipment",
      "users",
    ];

    console.log("🗑️  Dropping existing tables...");
    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`   - Dropped table: ${table}`);
    }

    // Drop functions and triggers
    await query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;`);
    console.log("   - Dropped triggers and functions");

    console.log("✅ Database reset completed!");
    console.log("\n🔄 Now run: npm run db:setup && npm run db:seed");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
};

resetDatabase();
