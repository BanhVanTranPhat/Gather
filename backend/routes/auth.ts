import express from "express";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { authenticate } from "../middleware/security.js";
import {
  sendOtp,
  otpLogin,
  googleAuth,
  checkEmail,
  refreshToken,
  logout,
  logoutAll,
  getSessions,
  deleteSession_,
} from "../controllers/authController.js";

const router = express.Router();

// Public — OTP passwordless flow
router
  .post("/check-email", checkEmail)
  .post("/send-otp", authRateLimiter, sendOtp)
  .post("/otp-login", authRateLimiter, otpLogin)
  .post("/google", googleAuth);

// Public — Token management
router.post("/refresh", refreshToken).post("/logout", logout);

// Protected — Session management
router
  .post("/logout-all", authenticate, logoutAll)
  .get("/sessions", authenticate, getSessions)
  .delete("/sessions/:sessionId", authenticate, deleteSession_);

export default router;
