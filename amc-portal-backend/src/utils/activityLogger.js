import { query } from "../config/database.js";

export const logActivity = async (
  userId,
  activityType,
  description,
  metadata = {},
  req = null,
) => {
  try {
    const ipAddress = req ? req.ip || req.connection.remoteAddress : null;
    const userAgent = req ? req.get("User-Agent") : null;
    const sessionId = req ? req.sessionID : null;

    await query(
      `INSERT INTO user_activities (user_id, activity_type, description, metadata, ip_address, user_agent, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        activityType,
        description,
        JSON.stringify(metadata),
        ipAddress,
        userAgent,
        sessionId,
      ],
    );
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw error to avoid breaking the main functionality
  }
};

export const getActivities = async (filters = {}) => {
  let queryText = `
    SELECT 
      ua.*,
      u.name as user_name,
      u.email as user_email
    FROM user_activities ua
    LEFT JOIN users u ON ua.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 0;

  if (filters.userId) {
    paramCount++;
    queryText += ` AND ua.user_id = $${paramCount}`;
    params.push(filters.userId);
  }

  if (filters.activityType) {
    paramCount++;
    queryText += ` AND ua.activity_type = $${paramCount}`;
    params.push(filters.activityType);
  }

  if (filters.startDate) {
    paramCount++;
    queryText += ` AND ua.created_at >= $${paramCount}`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    paramCount++;
    queryText += ` AND ua.created_at <= $${paramCount}`;
    params.push(filters.endDate);
  }

  queryText += ` ORDER BY ua.created_at DESC`;

  if (filters.limit) {
    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
  }

  const result = await query(queryText, params);
  return result.rows;
};

export const getActivityStats = async (userId = null) => {
  let queryText = `
    SELECT 
      activity_type,
      COUNT(*) as count,
      DATE(created_at) as date
    FROM user_activities
  `;
  let params = [];

  if (userId) {
    queryText += ` WHERE user_id = $1`;
    params = [userId];
  }

  queryText += `
    GROUP BY activity_type, DATE(created_at)
    ORDER BY date DESC, count DESC
  `;

  const result = await query(queryText, params);
  return result.rows;
};

// Predefined activity types
export const ACTIVITY_TYPES = {
  LOGIN: "login",
  LOGOUT: "logout",
  TASK_CREATED: "task_created",
  TASK_UPDATED: "task_updated",
  TASK_COMPLETED: "task_completed",
  TASK_ASSIGNED: "task_assigned",
  PROFILE_UPDATED: "profile_updated",
  PASSWORD_CHANGED: "password_changed",
  REMARK_ADDED: "remark_added",
  NOTIFICATION_READ: "notification_read",
  FILE_UPLOADED: "file_uploaded",
  DASHBOARD_VIEWED: "dashboard_viewed",
  REPORT_GENERATED: "report_generated",
  USER_REGISTERED: "user_registered",
};
