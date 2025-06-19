import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "amc_portal",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on("connect", () => {
  console.log("🗄️  Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
  console.error(
    "💡 Make sure PostgreSQL is running and credentials are correct",
  );
  console.error("📚 Check DATABASE_SETUP.md for setup instructions");
});

// Test initial connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connection test successful");
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to database:", err.message);
    console.error(
      "💡 Make sure PostgreSQL is running and credentials are correct",
    );
  }
};

// Test connection on startup
testConnection();

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("📊 Query executed", {
      text: text.substring(0, 50),
      duration,
      rows: res.rowCount,
    });
    return res;
  } catch (error) {
    console.error("❌ Query error:", error);
    throw error;
  }
};

// Helper function to get a client from the pool
export const getClient = async () => {
  return await pool.connect();
};

// Helper function to close the pool
export const closePool = async () => {
  await pool.end();
};

export default pool;
