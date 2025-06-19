import { query } from "../config/database.js";

export class Task {
  static async create(taskData) {
    const {
      title,
      description,
      category,
      priority,
      assignedTo,
      assignedBy,
      dueDate,
      estimatedTime,
    } = taskData;

    const result = await query(
      `INSERT INTO tasks (title, description, category, priority, assigned_to, assigned_by, due_date, estimated_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description,
        category,
        priority,
        assignedTo,
        assignedBy,
        dueDate,
        estimatedTime,
      ],
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT 
        t.*,
        u1.name as assigned_to_name,
        u1.email as assigned_to_email,
        u2.name as assigned_by_name,
        u2.email as assigned_by_email
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       WHERE t.id = $1`,
      [id],
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let queryText = `
      SELECT 
        t.*,
        u1.name as assigned_to_name,
        u1.email as assigned_to_email,
        u2.name as assigned_by_name,
        u2.email as assigned_by_email
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.assignedTo) {
      paramCount++;
      queryText += ` AND t.assigned_to = $${paramCount}`;
      params.push(filters.assignedTo);
    }

    if (filters.status) {
      paramCount++;
      queryText += ` AND t.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.category) {
      paramCount++;
      queryText += ` AND t.category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters.priority) {
      paramCount++;
      queryText += ` AND t.priority = $${paramCount}`;
      params.push(filters.priority);
    }

    if (filters.search) {
      paramCount++;
      queryText += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    queryText += ` ORDER BY t.created_at DESC`;

    if (filters.limit) {
      paramCount++;
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  static async updateStatus(id, status, actualTime = null) {
    let queryText = `UPDATE tasks SET status = $2`;
    let params = [id, status];
    let paramCount = 2;

    if (status === "completed") {
      paramCount++;
      queryText += `, completed_at = CURRENT_TIMESTAMP`;
      if (actualTime) {
        paramCount++;
        queryText += `, actual_time = $${paramCount}`;
        params.push(actualTime);
      }
    }

    queryText += ` WHERE id = $1 RETURNING *`;

    const result = await query(queryText, params);
    return result.rows[0];
  }

  static async update(id, updates) {
    const {
      title,
      description,
      category,
      priority,
      assignedTo,
      dueDate,
      estimatedTime,
      remarks,
    } = updates;

    const result = await query(
      `UPDATE tasks 
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           category = COALESCE($4, category),
           priority = COALESCE($5, priority),
           assigned_to = COALESCE($6, assigned_to),
           due_date = COALESCE($7, due_date),
           estimated_time = COALESCE($8, estimated_time),
           remarks = COALESCE($9, remarks)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        title,
        description,
        category,
        priority,
        assignedTo,
        dueDate,
        estimatedTime,
        remarks,
      ],
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM tasks WHERE id = $1`, [id]);
  }

  static async getStats(userId = null, role = null) {
    let queryText = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'overdue' OR (due_date < CURRENT_TIMESTAMP AND status != 'completed') THEN 1 END) as overdue_tasks
      FROM tasks
    `;

    let params = [];
    if (role === "user" && userId) {
      queryText += ` WHERE assigned_to = $1`;
      params = [userId];
    }

    const result = await query(queryText, params);
    const stats = result.rows[0];

    // Calculate compliance rate
    const totalTasks = parseInt(stats.total_tasks);
    const completedTasks = parseInt(stats.completed_tasks);
    const complianceRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks: parseInt(stats.pending_tasks),
      inProgressTasks: parseInt(stats.in_progress_tasks),
      overdueTasks: parseInt(stats.overdue_tasks),
      complianceRate,
    };
  }

  static async markOverdue() {
    // Update tasks that are past due date and not completed
    await query(
      `UPDATE tasks 
       SET status = 'overdue' 
       WHERE due_date < CURRENT_TIMESTAMP 
         AND status NOT IN ('completed', 'overdue')`,
    );
  }
}
