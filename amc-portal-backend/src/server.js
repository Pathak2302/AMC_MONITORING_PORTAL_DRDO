import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import notificationRoutes from "./routes/notifications.js";

// Import database connection
import "./config/database.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// WebSocket setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// General middleware
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Apply rate limiting
app.use("/api", limiter);

// Trust proxy for accurate IP detection
app.set("trust proxy", 1);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AMC Portal API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("📡 New WebSocket connection:", socket.id);

  // Join user-specific room
  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Handle task updates
  socket.on("task-updated", (data) => {
    // Broadcast to assigned user if different from sender
    if (data.assignedTo && data.assignedTo !== data.updatedBy) {
      io.to(`user-${data.assignedTo}`).emit("task-updated", data);
    }
  });

  // Handle new notifications
  socket.on("notification-created", (data) => {
    io.to(`user-${data.userId}`).emit("notification-created", data);
  });

  socket.on("disconnect", () => {
    console.log("📡 WebSocket disconnected:", socket.id);
  });
});

// Make io available to other modules
app.set("io", io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.details,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("🚀 AMC Portal Backend Server Started");
  console.log("================================");
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 WebSocket enabled on port ${PORT}`);
  console.log("================================");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
  });
});

export default app;
