import { Request, Response } from "express";
import User from "../models/User.js";
import OtpCode, { OtpPurpose } from "../models/OtpCode.js";
import { sanitizeString, isValidEmail } from "../utils/validators.js";
import {
  createSession,
  refreshAccessToken,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
  deleteUserSessionById,
} from "../utils/tokenManager.js";
import { sendOtpEmail } from "../utils/email.js";

// ─── Private Helpers ──────────────────────────────────────────────────────────

/** Generate and persist a 6-digit OTP code (10-minute TTL). */
async function generateOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await OtpCode.create({ email, code, purpose, used: false, expiresAt });
  console.log(`[OTP:${purpose}] ${email}: ${code}`);
  return code;
}

/** Find the latest unused OTP and validate it. Returns the doc or null. */
async function findValidOtp(email: string, purpose: OtpPurpose, code: string) {
  const doc = await OtpCode.findOne({ email, purpose, used: false })
    .sort({ createdAt: -1 })
    .exec();
  if (!doc || doc.code !== code || doc.expiresAt < new Date()) return null;
  return doc;
}

/** Mark all unused OTPs for a given email+purpose as used. */
async function consumeOtps(email: string, purpose: OtpPurpose) {
  await OtpCode.updateMany(
    { email, purpose, used: false },
    { $set: { used: true } },
  );
}

/** Find a unique username, appending a numeric suffix if needed. */
async function resolveUniqueUsername(base: string): Promise<string> {
  let username = base.slice(0, 20);
  let suffix = 0;
  while (await User.exists({ username })) {
    suffix++;
    username = `${base.slice(0, 17)}${suffix}`;
  }
  return username;
}

/** Derive device/IP info from the request for session creation. */
function getSessionMeta(req: Request) {
  return {
    deviceInfo: req.headers["user-agent"] || "Unknown",
    ipAddress: req.ip || req.socket.remoteAddress || "Unknown",
  };
}

/** Serialize a Mongoose user document into a safe public shape. */
function serializeUser(user: any, extended = false) {
  const base = {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
  };
  return extended ? { ...base, displayName: user.displayName } : base;
}

/** Create a session and return token pair. */
async function issueSession(req: Request, userId: string) {
  const { deviceInfo, ipAddress } = getSessionMeta(req);
  return createSession(
    userId,
    deviceInfo,
    ipAddress,
    req.headers["user-agent"],
  );
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * Send OTP to email.
 * Purpose: 'login' (used for both login and auto-register on first visit).
 */
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email || "").toLowerCase();
    const purpose: "register" | "login" =
      req.body.purpose === "login" ? "login" : "register";

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ message: "Valid email is required" });
      return;
    }

    const code = await generateOtp(email, purpose);
    const sent = await sendOtpEmail(
      email,
      code,
      purpose === "login" ? "register" : purpose,
    );

    res.json({
      message: sent
        ? "Mã xác thực đã được gửi đến email của bạn."
        : "Mã xác thực đã lưu (chưa cấu hình gửi mail – xem console server trong dev).",
      expiresIn: 600,
    });
  } catch (error) {
    console.error("send-otp error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Passwordless OTP login / auto-register.
 * - Validates OTP, then finds or creates the user by email.
 * - Returns tokens + `isNewUser` flag for frontend to handle onboarding.
 */
export const otpLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email || "").toLowerCase();
    const otp = sanitizeString(req.body.otp || "");

    if (!email || !otp) {
      res.status(400).json({ message: "Email và mã OTP là bắt buộc" });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ message: "Định dạng email không hợp lệ" });
      return;
    }

    const otpDoc = await findValidOtp(email, "login", otp);
    if (!otpDoc) {
      res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
      return;
    }

    await consumeOtps(email, "login");

    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      const base = (email.split("@")[0] || "user").replace(/[^a-z0-9_]/gi, "_");
      const username = await resolveUniqueUsername(base);
      user = await new User({ username, email }).save();
    } else {
      user.lastSeen = new Date();
      await user.save();
    }

    const { accessToken, refreshToken } = await issueSession(
      req,
      user._id.toString(),
    );
    res.json({
      accessToken,
      refreshToken,
      isNewUser,
      user: serializeUser(user, true),
    });
  } catch (error) {
    console.error("otp-login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Google OAuth — find or create user, then issue session.
 */
export const googleAuth = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { googleId, email, username, avatar } = req.body;

    if (!googleId || !email) {
      res.status(400).json({ message: "Google ID and email are required" });
      return;
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      const existing = await User.findOne({ email });
      if (existing) {
        existing.googleId = googleId;
        if (avatar) existing.avatar = avatar;
        user = await existing.save();
      } else {
        user = await new User({
          username: username || email.split("@")[0],
          email,
          googleId,
          avatar: avatar || "default",
        }).save();
      }
    } else if (avatar) {
      user.avatar = avatar;
      await user.save();
    }

    user.lastSeen = new Date();
    await user.save();

    const { accessToken, refreshToken } = await issueSession(
      req,
      user._id.toString(),
    );
    res.json({ accessToken, refreshToken, user: serializeUser(user) });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** Check if an email is already registered (for frontend hint). */
export const checkEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    res.json({ exists: !!(await User.exists({ email })) });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** Rotate or return an existing access token from a valid refresh token. */
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    const result = await refreshAccessToken(refreshToken);
    if (!result) {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.newRefreshToken || refreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** Invalidate the current device session. */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }
    await deleteSession(refreshToken);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** Invalidate all active sessions for the authenticated user. */
export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const deletedSessions = await deleteAllUserSessions(userId);
    res.json({ message: "Logged out from all devices", deletedSessions });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** List all active sessions (devices) for the authenticated user. */
export const getSessions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    res.json({ sessions: await getUserSessions(userId) });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/** Revoke a specific device session by session ID. */
export const deleteSession_ = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const sessionId = String(req.params.sessionId || "");

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!sessionId) {
      res.status(400).json({ message: "sessionId is required" });
      return;
    }

    const ok = await deleteUserSessionById(userId, sessionId);
    if (!ok) {
      res.status(404).json({ message: "Session not found" });
      return;
    }
    res.json({ message: "Logged out device" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
