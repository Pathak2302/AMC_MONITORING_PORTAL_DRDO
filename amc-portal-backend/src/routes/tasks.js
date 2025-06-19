import express from "express";
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
  createTaskValidation,
} from "../controllers/taskController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Stats endpoint
router.get("/stats", getTaskStats);

// CRUD routes
router.get("/", getTasks);
router.post("/", createTaskValidation, createTask);
router.get("/:id", getTask);
router.put("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.delete("/:id", deleteTask);

export default router;
