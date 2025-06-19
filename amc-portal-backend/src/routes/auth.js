import express from "express";
import {
  login,
  register,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  loginValidation,
  registerValidation,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/login", loginValidation, login);
router.post("/register", registerValidation, register);
router.post("/refresh", refreshToken);

// Protected routes
router.get("/me", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);
router.post("/logout", authenticate, logout);

export default router;
