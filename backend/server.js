import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chatRoutes.js";
import objectRoutes from "./routes/objectRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import { registerChatHandlers } from "./controllers/chatController.js";
import User from "./models/User.js";
import Room from "./models/Room.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/objects", objectRoutes);
app.use("/api/maps", mapRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/rooms", roomRoutes);

// Socket.IO Connection Handling
const connectedUsers = new Map(); // socketId -> userData
const roomUsers = new Map(); // roomId -> Set of socketIds

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins with user data
  socket.on("user-join", async (data) => {
    try {
      const { userId, username, roomId, avatar } = data;

      // Check for duplicate username in the room (active connections)
      const isUsernameTaken = Array.from(connectedUsers.values()).some(
        (u) => u.username === username && u.roomId === roomId
      );

      if (isUsernameTaken) {
        socket.emit("error", { message: "Tên người dùng đã tồn tại trong phòng này" });
        return;
      }

      // Find or create user in MongoDB to get persisted position
      let dbUser = await User.findOne({ username });
      let initialPosition = { x: 0, y: 0 };

      if (dbUser) {
        if (dbUser.position) {
          initialPosition = dbUser.position;
        }
      } else {
        // Create new user if not exists
        dbUser = new User({
          username,
          email: `${username}@guest.local`, // Fake email to satisfy unique constraint
          avatar,
          position: initialPosition,
        });
        await dbUser.save();
      }

      // Store user connection
      connectedUsers.set(socket.id, {
        userId,
        username,
        roomId,
        avatar,
        position: initialPosition,
        socketId: socket.id,
      });

      // Get or create room
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({
          roomId,
          name: `Room ${roomId}`,
          maxUsers: Number(process.env.DEFAULT_ROOM_CAPACITY) || 20, // Hỗ trợ tối đa mặc định 20 users
        });
        await room.save();
      }

      // Check room capacity (tối đa 20 users)
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
        position: initialPosition,
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

      // Emit join-success with user data (including position)
      socket.emit("join-success", {
        userId,
        username,
        avatar,
        position: initialPosition,
        roomId
      });

      console.log(`${username} joined room ${roomId} (${finalUserCount}/${room.maxUsers})`);
    } catch (error) {
      console.error("Error in user-join:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Handle avatar movement - Lắng nghe sự kiện "playerMovement"
  socket.on("playerMovement", (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      // Lưu trữ vị trí của người chơi
      user.position = data.position || { x: data.x, y: data.y };
      user.direction = data.direction;

      // Broadcast movement to other players (Real-time update)
      socket.to(user.roomId).emit("playerMoved", {
        userId: user.userId,
        position: user.position,
        direction: user.direction,
      });

      // Lấy tất cả người chơi trong room
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

      // Phát (broadcast) vị trí của tất cả người chơi cho mọi client khác trong room
      socket.to(user.roomId).emit("allPlayersPositions", allPlayersInRoom);

      // Gửi lại cho chính người chơi đó (để đồng bộ)
      socket.emit("allPlayersPositions", allPlayersInRoom);
    }
  });

  // Handle reactions
  socket.on("reaction", (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    // Broadcast reaction to all users in room
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

    // Broadcast drawing to all users in room (except sender)
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
      (u) =>
        u.userId === targetUserId &&
        u.roomId === connectedUsers.get(socket.id)?.roomId
    );

    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-offer", {
        fromUserId: connectedUsers.get(socket.id)?.userId,
        offer,
      });
    }
  });

  socket.on("webrtc-answer", (data) => {
    const { targetUserId, answer } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) =>
        u.userId === targetUserId &&
        u.roomId === connectedUsers.get(socket.id)?.roomId
    );

    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-answer", {
        fromUserId: connectedUsers.get(socket.id)?.userId,
        answer,
      });
    }
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const { targetUserId, candidate } = data;
    const targetUser = Array.from(connectedUsers.values()).find(
      (u) =>
        u.userId === targetUserId &&
        u.roomId === connectedUsers.get(socket.id)?.roomId
    );

    if (targetUser) {
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
      // Save user position to MongoDB
      try {
        await User.findOneAndUpdate(
          { username: user.username },
          { position: user.position, lastSeen: Date.now() },
          { upsert: true }
        );
      } catch (error) {
        console.error("Error saving user position on disconnect:", error);
      }

      // Remove from room
      if (roomUsers.has(user.roomId)) {
        roomUsers.get(user.roomId).delete(socket.id);
        if (roomUsers.get(user.roomId).size === 0) {
          roomUsers.delete(user.roomId);
        }
      }

      // Notify others
      socket.to(user.roomId).emit("user-left", {
        userId: user.userId,
      });

      // Update room info
      const finalUserCount = roomUsers.get(user.roomId)?.size || 0;
      if (roomUsers.has(user.roomId)) {
        try {
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

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.get("/api/rooms/:roomId/users", (req, res) => {
  const { roomId } = req.params;
  const users = Array.from(connectedUsers.values())
    .filter((u) => u.roomId === roomId)
    .map((u) => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar,
      position: u.position,
    }));
  res.json(users);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
