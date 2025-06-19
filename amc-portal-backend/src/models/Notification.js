import { query } from "../config/database.js";

export class Notification {
  static async create(notificationData) {
    const {
      title,
      message,
      type,
      priority,
      userId,
      metadata = {},
    } = notificationData;

    const result = await query(
      `INSERT INTO notifications (title, message, type, priority, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, message, type, priority, userId, JSON.stringify(metadata)],
    );

    return result.rows[0];
  }

  static async findByUserId(userId, filters = {}) {
    let queryText = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (filters.isRead !== undefined) {
      paramCount++;
      queryText += ` AND is_read = $${paramCount}`;
      params.push(filters.isRead);
    }

    if (filters.type) {
      paramCount++;
      queryText += ` AND type = $${paramCount}`;
      params.push(filters.type);
    }

    queryText += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      paramCount++;
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  static async markAsRead(id, userId) {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
  }

  static async delete(id, userId) {
    await query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
  }

  static async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return parseInt(result.rows[0].count);
  }

  static async createTaskNotification(taskData, assigneeId) {
    if (!assigneeId) return null;

    return await this.create({
      title: "New Task Assigned",
      message: `You have been assigned a new ${taskData.category} task: ${taskData.title}`,
      type: "task-assigned",
      priority: taskData.priority,
      userId: assigneeId,
      metadata: {
        taskId: taskData.id,
        taskTitle: taskData.title,
        dueDate: taskData.due_date,
      },
    });
  }

  static async createTaskReminderNotification(task) {
    if (!task.assigned_to) return null;

    return await this.create({
      title: "Task Reminder",
      message: `Reminder: Task "${task.title}" is due soon`,
      type: "task-reminder",
      priority: "medium",
      userId: task.assigned_to,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.due_date,
      },
    });
  }

  static async createTaskOverdueNotification(task) {
    if (!task.assigned_to) return null;

    return await this.create({
      title: "Task Overdue",
      message: `Task "${task.title}" is now overdue`,
      type: "task-overdue",
      priority: "high",
      userId: task.assigned_to,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.due_date,
      },
    });
  }
}
