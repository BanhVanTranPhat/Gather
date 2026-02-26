import express from "express";
import {
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserAvatar,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/security.js";

const router = express.Router();

// Get user profile (current user)
router.get("/profile", authenticate, getUserProfile);

// Aliases for frontend compatibility (Must be before /:userId)
router.get("/me", authenticate, getUserProfile);
router.get("/settings", (req, res) => res.json({})); // Placeholder for settings

// Update user profile
router.put("/profile", authenticate, updateUserProfile);

// Update user avatar
router.post("/avatar", authenticate, updateUserAvatar);

// Set display name (after first login / onboarding)
router.patch("/display-name", authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const displayName = (req.body.displayName || "").toString().trim();
    if (!displayName) {
      res.status(400).json({ message: "Tên hiển thị không được để trống" });
      return;
    }
    if (displayName.length > 50) {
      res.status(400).json({ message: "Tên tối đa 50 ký tự" });
      return;
    }
    const { default: User } = await import("../models/User.js");
    const user = await User.findByIdAndUpdate(
      userId,
      { displayName },
      { new: true, select: "displayName username email avatar role" },
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ displayName: user.displayName });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user by ID (public profile) - Must be last
router.get("/:userId", getUserById);

export default router;
