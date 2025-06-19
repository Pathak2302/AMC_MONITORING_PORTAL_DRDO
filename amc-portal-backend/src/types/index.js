// Type definitions for the backend (JavaScript version)

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

export const TASK_CATEGORIES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export const TASK_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  OVERDUE: "overdue",
};

export const TASK_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: "task-assigned",
  TASK_REMINDER: "task-reminder",
  TASK_OVERDUE: "task-overdue",
  SYSTEM_ALERT: "system-alert",
};

// Validation helpers
export const isValidRole = (role) => Object.values(USER_ROLES).includes(role);
export const isValidTaskCategory = (category) =>
  Object.values(TASK_CATEGORIES).includes(category);
export const isValidTaskStatus = (status) =>
  Object.values(TASK_STATUSES).includes(status);
export const isValidTaskPriority = (priority) =>
  Object.values(TASK_PRIORITIES).includes(priority);
export const isValidNotificationType = (type) =>
  Object.values(NOTIFICATION_TYPES).includes(type);
