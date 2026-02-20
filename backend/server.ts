import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Load .env from backend folder (same dir as server.ts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { sanitizeBody, sanitizeQuery } from "./middleware/security.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger, errorHandler, notFoundHandler } from "./middleware/logging.js";
import { logger } from "./utils/logger.js";

// Import existing routes and models
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chatRoutes.js";
import worldRoutes from "./routes/worldRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import { registerChatHandlers } from "./controllers/chatController.js";
import Room from "./models/Room.js";
import RoomMember from "./models/RoomMember.js";
import User from "./models/User.js";
import { registerSFUHandlers } from "./webrtc/sfu.js";
import { createBatchUpdater } from "./socket/types.js";
import { registerRoomHandlers } from "./socket/handlers/roomHandlers.js";
import { registerMovementHandlers } from "./socket/handlers/movementHandlers.js";
import { registerVoiceHandlers } from "./socket/handlers/voiceHandlers.js";

// Tải biến môi trường (Loaded at top)

const app = express();
const httpServer = createServer(app); // Sử dụng httpServer cho Socket.IO
const PORT = process.env.PORT || 5001; // Default to 5001 as per previous fix

const parseCsv = (value?: string) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const allowedOrigins = new Set<string>([
  "http://localhost:3000",
  "http://localhost:5173",
  ...parseCsv(process.env.CLIENT_URL),
  ...parseCsv(process.env.CLIENT_URLS),
]);

const netlifySiteName = (process.env.NETLIFY_SITE_NAME || "").trim().toLowerCase();
const allowNetlifyPreviews = process.env.ALLOW_NETLIFY_PREVIEWS === "true" && !!netlifySiteName;
const netlifyPreviewRegex = allowNetlifyPreviews
  ? new RegExp(`^[a-z0-9-]+--${escapeRegex(netlifySiteName)}\\.netlify\\.app$`)
  : null;

const isAllowedOrigin = (origin?: string) => {
  // Allow same-origin/curl/server-to-server requests where Origin header is absent.
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const url = new URL(origin);
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    ) {
      return true;
    }

    if (
      allowNetlifyPreviews &&
      url.protocol === "https:" &&
      netlifyPreviewRegex &&
      netlifyPreviewRegex.test(url.hostname)
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

// Middleware CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());

// DEBUG: Log all requests (only when LOG_LEVEL=debug)
app.use((req, res, next) => {
  if ((process.env.LOG_LEVEL || "").toLowerCase() === "debug") {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl || req.url}`);
  }
  // Fix Cross-Origin-Opener-Policy warnings for Google OAuth popups
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Add request logger
app.use(requestLogger);

// Apply input sanitization middleware globally
app.use(sanitizeBody);
app.use(sanitizeQuery);

// Health check endpoint (before rate limiting)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Apply rate limiting to all API routes
app.use("/api", apiRateLimiter);

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Socket CORS blocked for origin: ${origin}`), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Voice rule: track which voice channel a user is currently in (per room)
// Key: `${roomId}:${userId}` -> channelId
const userActiveVoiceChannel = new Map<string, string>();

// Online status rule: debounce offline by 5s to avoid flicker on quick reconnect
// Key: `${roomId}:${userId}` -> timeout
const pendingOfflineTimers = new Map<string, NodeJS.Timeout>();

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town")
  .then(() => logger.info("MongoDB connected successfully"))
  .catch((err) => logger.error("MongoDB connection error", err));

// ----------------------------------------------------------------
// PHẦN LOGIC AUTH (Google + OTP)
// ----------------------------------------------------------------
// Note: Authentication logic (Register, Login, OTP, Google OAuth)
// is handled in routes/auth.ts which is mounted at /api/auth below.


// ----------------------------------------------------------------
// EXISTING ROUTES & GAME LOGIC
// ----------------------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/world", worldRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes); // Alias for frontend compatibility

app.use("/api/spaces", spaceRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/forum", (req, res, next) => {
  console.log(`[Server] Forum route hit: ${req.method} ${req.path}`);
  next();
}, forumRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Room users endpoint
app.get("/api/rooms/:roomId/users", async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    // Get all room members from database (including offline)
    const allMembers = await RoomMember.find({ roomId }).lean();

    // Get online users from connectedUsers
    const onlineUserIds = new Set(
      Array.from(connectedUsers.values())
        .filter((u) => u.roomId === roomId)
        .map((u) => u.userId)
    );

    // Dedupe by userId (defensive: unique index should prevent DB dupes)
    const byUserId = new Map<string, any>();
    allMembers.forEach((member: any) => byUserId.set(String(member.userId), member));
    const users = Array.from(byUserId.values()).map((member: any) => {
      const connectedUser = Array.from(connectedUsers.values()).find(
        (u) => u.userId === member.userId && u.roomId === roomId
      );

      return {
        userId: member.userId,
        username: member.username,
        avatar: member.avatar,
        position: connectedUser?.position || { x: 0, y: 0 },
        status: onlineUserIds.has(member.userId) ? "online" : "offline",
        lastSeen: member.lastSeen,
        role: member.role || "member",
      };
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching room users:", error);
    res.status(500).json({ message: "Failed to fetch room users" });
  }
});

// Room invite endpoint (alias for /api/spaces/:roomId/invite)
app.post("/api/rooms/:roomId/invite", async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"
      }/lobby?room=${roomId}`;

    res.json({
      inviteLink,
      roomId: room.roomId,
      roomName: room.name,
      maxUsers: room.maxUsers,
    });
  } catch (error) {
    console.error("Error generating invite link:", error);
    res.status(500).json({ message: "Failed to generate invite link" });
  }
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Error handling middleware is already imported and used above

// Socket.IO Connection Handling
interface ConnectedUser {
  userId: string;
  username: string;
  roomId: string;
  avatar?: string;
  position: { x: number; y: number };
  direction?: string;
  socketId: string;
}

interface GroupChat {
  id: string;
  name: string;
  members: string[];
  roomId: string;
  createdBy: string;
  createdAt: number;
}

const connectedUsers = new Map<string, ConnectedUser>(); // socketId -> userData
const roomUsers = new Map<string, Set<string>>(); // roomId -> Set of socketIds
const groupChats = new Map<string, GroupChat>(); // groupId -> { id, name, members, roomId, createdBy }
const voiceChannels = new Map<string, Set<string>>(); // channelId -> Set of userIds (GLOBAL, shared across all connections)
const batchUpdateIntervals = new Map<string, NodeJS.Timeout>(); // roomId -> interval for batch position updates

// Socket event rate limiting (in-memory)
type SocketRateKey = string;
const socketRateStore = new Map<SocketRateKey, { count: number; resetTime: number }>();
const socketRateHit = (key: SocketRateKey, windowMs: number, max: number) => {
  const t = Date.now();
  const cur = socketRateStore.get(key);
  if (!cur || cur.resetTime <= t) {
    socketRateStore.set(key, { count: 1, resetTime: t + windowMs });
    return { limited: false, retryAfterSec: 0 };
  }
  if (cur.count >= max) {
    return { limited: true, retryAfterSec: Math.ceil((cur.resetTime - t) / 1000) };
  }
  cur.count += 1;
  socketRateStore.set(key, cur);
  return { limited: false, retryAfterSec: 0 };
};

const startBatchUpdateForRoom = createBatchUpdater(io, connectedUsers, roomUsers, batchUpdateIntervals);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  registerRoomHandlers(io, socket, {
    connectedUsers,
    roomUsers,
    batchUpdateIntervals,
    pendingOfflineTimers,
    userActiveVoiceChannel,
    voiceChannels,
    socketRateHit,
    startBatchUpdateForRoom,
    Room,
    RoomMember,
  });
  registerMovementHandlers(io, socket, connectedUsers);
  registerVoiceHandlers(io, socket, {
    connectedUsers,
    roomUsers,
    voiceChannels,
    userActiveVoiceChannel,
    socketRateHit,
  });
  registerChatHandlers({ io, socket, connectedUsers, roomUsers, groupChats });
  registerSFUHandlers(io, socket);

  socket.on("whiteboard-draw", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    socket.to(user.roomId).emit("whiteboard-draw", {
      ...data,
      userId: user.userId,
      username: user.username,
    });
  });

  socket.on("webrtc-offer", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    const { targetUserId, offer } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) => u.userId === targetUserId && u.roomId === user.roomId
    );
    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-offer", { fromUserId: user.userId, offer });
    } else {
      console.warn(`Target user ${targetUserId} not found for WebRTC offer`);
    }
  });

  socket.on("webrtc-answer", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    const { targetUserId, answer } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) => u.userId === targetUserId && u.roomId === user.roomId
    );
    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-answer", { fromUserId: user.userId, answer });
    } else {
      console.warn(`Target user ${targetUserId} not found for WebRTC answer`);
    }
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    const { targetUserId, candidate } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) => u.userId === targetUserId && u.roomId === user.roomId
    );
    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-ice-candidate", { fromUserId: user.userId, candidate });
    } else {
      console.warn(`Target user ${targetUserId} not found for WebRTC ICE candidate`);
    }
  });
});

// (user-join, playerMovement, reaction, join/leave-voice, disconnect moved to socket/handlers/)

httpServer.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || "development",
  });
});
