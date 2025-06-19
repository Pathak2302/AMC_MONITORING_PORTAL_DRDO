import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { logActivity, ACTIVITY_TYPES } from "../utils/activityLogger.js";
import { body, validationResult } from "express-validator";
import {
  isValidTaskCategory,
  isValidTaskPriority,
  isValidTaskStatus,
} from "../types/index.js";

export const createTaskValidation = [
  body("title").trim().isLength({ min: 1 }).withMessage("Title is required"),
  body("description").optional().trim(),
  body("category")
    .isIn(["daily", "weekly", "monthly"])
    .withMessage("Category must be daily, weekly, or monthly"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  body("assignedTo")
    .optional()
    .isUUID()
    .withMessage("Assigned to must be a valid user ID"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("estimatedTime")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Estimated time must be a positive integer"),
];

export const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      title,
      description,
      category,
      priority = "medium",
      assignedTo,
      dueDate,
      estimatedTime,
    } = req.body;

    // If assignedTo is provided, verify the user exists
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: "Assigned user not found",
        });
      }
    }

    // Generate due date if not provided based on category
    let finalDueDate = dueDate;
    if (!finalDueDate) {
      const now = new Date();
      switch (category) {
        case "daily":
          finalDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "weekly":
          finalDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          finalDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const task = await Task.create({
      title,
      description,
      category,
      priority,
      assignedTo,
      assignedBy: req.user.id,
      dueDate: finalDueDate,
      estimatedTime,
    });

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.TASK_CREATED,
      `Created task: ${title}`,
      { taskId: task.id, category, priority },
      req,
    );

    // If task is assigned to someone else, log assignment activity and create notification
    if (assignedTo && assignedTo !== req.user.id) {
      await logActivity(
        req.user.id,
        ACTIVITY_TYPES.TASK_ASSIGNED,
        `Assigned task: ${title}`,
        { taskId: task.id, assignedTo },
        req,
      );

      // Create notification for the assigned user
      await Notification.createTaskNotification(task, assignedTo);
    }

    const taskWithDetails = await Task.findById(task.id);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: taskWithDetails,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTasks = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      search,
      assignedTo,
      limit = 50,
      page = 1,
    } = req.query;

    const filters = {};

    // For regular users, only show their assigned tasks
    if (req.user.role === "user") {
      filters.assignedTo = req.user.id;
    } else if (assignedTo) {
      filters.assignedTo = assignedTo;
    }

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);

    const tasks = await Task.findAll(filters);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: tasks.length,
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user has permission to view this task
    if (
      req.user.role === "user" &&
      task.assigned_to !== req.user.id &&
      task.assigned_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this task",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "user" &&
      task.assigned_to !== req.user.id &&
      task.assigned_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this task",
      });
    }

    const updatedTask = await Task.update(id, updates);

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.TASK_UPDATED,
      `Updated task: ${updatedTask.title}`,
      { taskId: id, updates },
      req,
    );

    const taskWithDetails = await Task.findById(id);

    res.json({
      success: true,
      message: "Task updated successfully",
      data: taskWithDetails,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualTime } = req.body;

    if (!["pending", "in-progress", "completed", "overdue"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check permissions
    if (req.user.role === "user" && task.assigned_to !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update status of tasks assigned to you",
      });
    }

    const updatedTask = await Task.updateStatus(id, status, actualTime);

    // Log activity
    const activityType =
      status === "completed"
        ? ACTIVITY_TYPES.TASK_COMPLETED
        : ACTIVITY_TYPES.TASK_UPDATED;

    await logActivity(
      req.user.id,
      activityType,
      `Changed task status to ${status}: ${updatedTask.title}`,
      { taskId: id, oldStatus: task.status, newStatus: status, actualTime },
      req,
    );

    const taskWithDetails = await Task.findById(id);

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: taskWithDetails,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Only admin or task creator can delete
    if (req.user.role !== "admin" && task.assigned_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this task",
      });
    }

    await Task.delete(id);

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.TASK_UPDATED,
      `Deleted task: ${task.title}`,
      { taskId: id },
      req,
    );

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    // Mark overdue tasks first
    await Task.markOverdue();

    const stats = await Task.getStats(req.user.id, req.user.role);

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.DASHBOARD_VIEWED,
      "Viewed dashboard stats",
      {},
      req,
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
