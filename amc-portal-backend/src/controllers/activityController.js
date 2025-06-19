import { getActivities, getActivityStats } from "../utils/activityLogger.js";

export const getUserActivities = async (req, res) => {
  try {
    const { limit = 50, activityType, startDate, endDate } = req.query;

    const filters = {
      userId: req.user.role === "admin" ? req.query.userId : req.user.id,
      limit: parseInt(limit),
    };

    if (activityType) filters.activityType = activityType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const activities = await getActivities(filters);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getActivityStatistics = async (req, res) => {
  try {
    const userId = req.user.role === "admin" ? req.query.userId : req.user.id;

    const stats = await getActivityStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get activity stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
