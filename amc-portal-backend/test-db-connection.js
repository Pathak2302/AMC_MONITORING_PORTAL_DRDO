import { query, closePool } from "./src/config/database.js";

const testConnection = async () => {
  console.log("🔍 Testing database connection...");

  try {
    // Simple test query
    const result = await query("SELECT NOW() as current_time");
    console.log("✅ Database connection successful!");
    console.log("📅 Current time:", result.rows[0].current_time);

    // Test if tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(
      "📋 Existing tables:",
      tables.rows.map((row) => row.table_name),
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error(
      "💡 Make sure PostgreSQL is running and credentials are correct in .env file",
    );

    if (error.code === "ECONNREFUSED") {
      console.error("🔧 PostgreSQL server is not running. Start it with:");
      console.error(
        "   Docker: docker run --name amc-postgres -e POSTGRES_DB=amc_portal -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15",
      );
      console.error("   Or start your local PostgreSQL service");
    }

    if (error.code === "3D000") {
      console.error("🗄️  Database 'amc_portal' doesn't exist. Create it with:");
      console.error("   createdb amc_portal");
      console.error("   Or run: npm run db:setup");
    }
  } finally {
    await closePool();
  }
};

testConnection();
