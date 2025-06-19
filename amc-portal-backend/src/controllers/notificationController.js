import { Notification } from "../models/Notification.js";
import { logActivity, ACTIVITY_TYPES } from "../utils/activityLogger.js";

export const getNotifications = async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false, type } = req.query;

    const filters = {
      limit: parseInt(limit),
    };

    if (unreadOnly === "true") {
      filters.isRead = false;
    }

    if (type) {
      filters.type = type;
    }

    const notifications = await Notification.findByUserId(req.user.id, filters);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.markAsRead(id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.NOTIFICATION_READ,
      "Marked notification as read",
      { notificationId: id },
      req,
    );

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.NOTIFICATION_READ,
      "Marked all notifications as read",
      {},
      req,
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.delete(id, req.user.id);

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { title, message, type, priority, userId } = req.body;

    // Only admin can create notifications for other users
    if (req.user.role !== "admin" && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only create notifications for yourself",
      });
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      userId: userId || req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
