import { User } from "../models/User.js";
import { logActivity, ACTIVITY_TYPES } from "../utils/activityLogger.js";
import { body, validationResult } from "express-validator";

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const users = await User.findAll(role);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await User.updateProfile(id, updates);

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.PROFILE_UPDATED,
      `Admin updated user profile: ${user.name}`,
      { targetUserId: id, updates },
      req,
    );

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.deactivate(id);

    // Log activity
    await logActivity(
      req.user.id,
      ACTIVITY_TYPES.USER_REGISTERED,
      `Admin deactivated user: ${user.name}`,
      { targetUserId: id },
      req,
    );

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
