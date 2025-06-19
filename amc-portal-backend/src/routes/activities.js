import express from "express";
import {
  getUserActivities,
  getActivityStatistics,
} from "../controllers/activityController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Activity routes
router.get("/", getUserActivities);
router.get("/stats", getActivityStatistics);

export default router;
