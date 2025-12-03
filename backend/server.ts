import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import existing routes and models
// @ts-ignore
import authRoutes from "./routes/auth.js";
// @ts-ignore
import chatRoutes from "./routes/chatRoutes.js";
// @ts-ignore
import objectRoutes from "./routes/objectRoutes.js";
// @ts-ignore
import mapRoutes from "./routes/mapRoutes.js";
// @ts-ignore
import userRoutes from "./routes/userRoutes.js";
// @ts-ignore
import eventRoutes from "./routes/eventRoutes.js";
// @ts-ignore
import roomRoutes from "./routes/roomRoutes.js";
// @ts-ignore
import { registerChatHandlers } from "./controllers/chatController.js";
// @ts-ignore
import User from "./models/User.js";
// @ts-ignore
import Room from "./models/Room.js";

// Tải biến môi trường
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app); // Sử dụng httpServer cho Socket.IO
const PORT = process.env.PORT || 5001; // Default to 5001 as per previous fix

// Middleware CORS
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ----------------------------------------------------------------
// PHẦN LOGIC AUTH (Google + OTP)
// ----------------------------------------------------------------

interface OtpEntry {
  code: string;
  expires: number;
}

const otpStore = new Map<string, OtpEntry>();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "your-very-secret-key-fallback";
const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 phút

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createEmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// === ROUTE XÁC THỰC GOOGLE ===
app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token, 
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error("Invalid Google token");
        }
        console.log('✅ [Verified] Xác thực Google thành công cho:', payload.email);
        
        // Kiểm tra xem user đã tồn tại chưa, nếu chưa thì tạo mới (Optional - tùy logic game)
        // Hiện tại chỉ trả về token
        const serverToken = jwt.sign({ email: payload.email, name: payload.name }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: "Xác thực Google thành công", serverToken });
    } catch (error) {
        console.error("Lỗi xác thực Google:", error);
        res.status(401).json({ message: "Xác thực thất bại." });
    }
});

// === ROUTE OTP ===
app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
  try {
    const { email, recaptchaToken } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email." });
    }
    
    // == XÁC THỰC RECAPTCHA ==
    // Nếu không có secret key (dev mode), có thể bỏ qua hoặc warn
    if (process.env.GOOGLE_RECAPTCHA_SECRET_KEY) {
        const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        });
        const recaptchaData = await recaptchaResponse.json();
        if (!recaptchaData.success) {
            return res.status(400).json({ message: "Xác thực CAPTCHA không thành công." });
        }
        console.log("✅ [Verified] Xác thực reCAPTCHA thành công cho:", email);
    } else {
        console.warn("⚠️ Skipping reCAPTCHA verification: GOOGLE_RECAPTCHA_SECRET_KEY not set");
    }

    const code = generateOtp();
    const expires = Date.now() + OTP_EXPIRATION_MS;

    otpStore.set(email, { code, expires });
    console.log(`Đã tạo mã OTP ${code} cho ${email}`);

    const transporter = await createEmailTransporter();
    const mailOptions = {
      from: '"Gather Clone" <noreply@gatherclone.com>',
      to: email,
      subject: "Mã xác thực đăng nhập",
      text: `Mã xác thực của bạn là: ${code}. Mã này sẽ hết hạn sau 5 phút.`,
      html: `<b>Mã xác thực của bạn là: ${code}</b><p>Mã này sẽ hết hạn sau 5 phút.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Mã OTP đã được gửi. Vui lòng kiểm tra email." });

  } catch (error) {
    console.error("Lỗi khi gửi OTP:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
  }
});

app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Vui lòng nhập email và mã OTP." });
    }

    const storedEntry = otpStore.get(email);
    if (!storedEntry) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn." });
    }
    if (Date.now() > storedEntry.expires) {
      otpStore.delete(email); 
      return res.status(400).json({ message: "Mã OTP đã hết hạn." });
    }
    if (storedEntry.code !== otp) {
      return res.status(400).json({ message: "Mã OTP không chính xác." });
    }

    otpStore.delete(email); 

    const token = jwt.sign({ email: email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log(`✅ Xác thực thành công cho ${email}`);
    res.status(200).json({ message: "Đăng nhập thành công!", token: token });

  } catch (error) {
    console.error("Lỗi khi xác minh OTP:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
  }
});

// ----------------------------------------------------------------
// EXISTING ROUTES & GAME LOGIC
// ----------------------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/objects", objectRoutes);
app.use("/api/maps", mapRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/api/rooms/:roomId/users", (req: Request, res: Response) => {
  const { roomId } = req.params;
  const users = Array.from(connectedUsers.values())
    .filter((u: any) => u.roomId === roomId)
    .map((u: any) => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar,
      position: u.position,
    }));
  res.json(users);
});

// Socket.IO Connection Handling
const connectedUsers = new Map(); // socketId -> userData
const roomUsers = new Map(); // roomId -> Set of socketIds

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins with user data
  socket.on("user-join", async (data) => {
    try {
      const { userId, username, roomId, avatar } = data;

      // Store user connection
      connectedUsers.set(socket.id, {
        userId,
        username,
        roomId,
        avatar,
        position: { x: 0, y: 0 },
        socketId: socket.id,
      });

      // Get or create room
      // @ts-ignore
      let room = await Room.findOne({ roomId });
      if (!room) {
        // @ts-ignore
        room = new Room({
          roomId,
          name: `Room ${roomId}`,
          maxUsers: Number(process.env.DEFAULT_ROOM_CAPACITY) || 20,
        });
        await room.save();
      }

      // Check room capacity
      const currentUserCount = roomUsers.get(roomId)?.size || 0;
      if (currentUserCount >= room.maxUsers) {
        socket.emit("room-full", { 
          message: `Phòng đã đầy (${room.maxUsers}/${room.maxUsers} người)`,
          maxUsers: room.maxUsers,
          currentUsers: currentUserCount
        });
        return;
      }

      // Add to room
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);
      socket.join(roomId);

      // Notify others in room
      socket.to(roomId).emit("user-joined", {
        userId,
        username,
        avatar,
        position: { x: 0, y: 0 },
      });

      // Send current users in room to the new user
      const usersInRoom = Array.from(roomUsers.get(roomId))
        .filter((id) => id !== socket.id)
        .map((id) => connectedUsers.get(id))
        .filter(Boolean);

      socket.emit("room-users", usersInRoom);
      
      // Emit room info with user count
      const finalUserCount = roomUsers.get(roomId)?.size || 0;
      io.to(roomId).emit("room-info", {
        roomId,
        currentUsers: finalUserCount,
        maxUsers: room.maxUsers,
      });

      console.log(`${username} joined room ${roomId} (${finalUserCount}/${room.maxUsers})`);
    } catch (error) {
      console.error("Error in user-join:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Handle avatar movement
  socket.on("playerMovement", (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.position = data.position || { x: data.x, y: data.y };
      user.direction = data.direction;

      const allPlayersInRoom = Array.from(roomUsers.get(user.roomId) || [])
        .map((id) => {
          const u = connectedUsers.get(id);
          if (u) {
            return {
              userId: u.userId,
              username: u.username,
              avatar: u.avatar,
              position: u.position,
              direction: u.direction,
            };
          }
          return null;
        })
        .filter(Boolean);

      socket.to(user.roomId).emit("allPlayersPositions", allPlayersInRoom);
      socket.emit("allPlayersPositions", allPlayersInRoom);
    }
  });

  // Handle reactions
  socket.on("reaction", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    io.to(user.roomId).emit("reaction", {
      userId: user.userId,
      reaction: data.reaction,
      timestamp: data.timestamp || Date.now(),
    });
  });

  registerChatHandlers({ io, socket, connectedUsers, roomUsers });

  // Whiteboard handlers
  socket.on("whiteboard-draw", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    socket.to(user.roomId).emit("whiteboard-draw", {
      ...data,
      userId: user.userId,
      username: user.username,
    });
  });

  // WebRTC Signaling
  socket.on("webrtc-offer", (data) => {
    const { targetUserId, offer } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u: any) =>
        u.userId === targetUserId &&
        u.roomId === connectedUsers.get(socket.id)?.roomId
    );

    // @ts-ignore
    if (targetUser) {
      // @ts-ignore
      io.to(targetUser.socketId).emit("webrtc-offer", {
        fromUserId: connectedUsers.get(socket.id)?.userId,
        offer,
      });
    }
  });

  socket.on("webrtc-answer", (data) => {
    const { targetUserId, answer } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u: any) =>
        u.userId === targetUserId &&
        u.roomId === connectedUsers.get(socket.id)?.roomId
    );

    // @ts-ignore
    if (targetUser) {
      // @ts-ignore
      io.to(targetUser.socketId).emit("webrtc-answer", {
        fromUserId: connectedUsers.get(socket.id)?.userId,
        answer,
      });
    }
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const { targetUserId, candidate } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u: any) =>
        u.userId === targetUserId &&
        u.roomId === connectedUsers.get(socket.id)?.roomId
    );

    // @ts-ignore
    if (targetUser) {
      // @ts-ignore
      io.to(targetUser.socketId).emit("webrtc-ice-candidate", {
        fromUserId: connectedUsers.get(socket.id)?.userId,
        candidate,
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      if (roomUsers.has(user.roomId)) {
        roomUsers.get(user.roomId).delete(socket.id);
        if (roomUsers.get(user.roomId).size === 0) {
          roomUsers.delete(user.roomId);
        }
      }

      socket.to(user.roomId).emit("user-left", {
        userId: user.userId,
      });
      
      const finalUserCount = roomUsers.get(user.roomId)?.size || 0;
      if (roomUsers.has(user.roomId)) {
        try {
          // @ts-ignore
          const room = await Room.findOne({ roomId: user.roomId });
          if (room) {
            io.to(user.roomId).emit("room-info", {
              roomId: user.roomId,
              currentUsers: finalUserCount,
              maxUsers: room.maxUsers,
            });
          }
        } catch (error) {
          console.error("Error updating room info on disconnect:", error);
        }
      }

      connectedUsers.delete(socket.id);
      console.log(`${user.username} disconnected`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Backend server (TypeScript) running on port ${PORT}`);
});