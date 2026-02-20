import type { Server } from "socket.io";
import type { Socket } from "socket.io";
import type { ConnectedUser } from "../types.js";
import type { SocketRateHit } from "../types.js";
export interface RoomHandlerState {
  connectedUsers: Map<string, ConnectedUser>;
  roomUsers: Map<string, Set<string>>;
  batchUpdateIntervals: Map<string, NodeJS.Timeout>;
  pendingOfflineTimers: Map<string, NodeJS.Timeout>;
  userActiveVoiceChannel: Map<string, string>;
  voiceChannels: Map<string, Set<string>>;
  socketRateHit: SocketRateHit;
  startBatchUpdateForRoom: (roomId: string) => void;
  Room: any;
  RoomMember: any;
}

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  state: RoomHandlerState
): void {
  const {
    connectedUsers,
    roomUsers,
    batchUpdateIntervals,
    pendingOfflineTimers,
    userActiveVoiceChannel,
    voiceChannels,
    startBatchUpdateForRoom,
    Room,
    RoomMember,
  } = state;

  socket.on("user-join", async (data: {
    userId: string;
    username: string;
    roomId: string;
    avatar?: string;
    avatarConfig?: unknown;
    position?: { x: number; y: number };
  }) => {
    try {
      const { userId, username, roomId, avatar, avatarConfig, position } = data;
      const startPosition =
        position &&
        typeof position.x === "number" &&
        typeof position.y === "number"
          ? position
          : { x: 100, y: 100 };

      if (!username || username.trim() === "") {
        socket.emit("app-error", { message: "Tên người dùng không được để trống" });
        return;
      }

      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({
          roomId,
          name: `Room ${roomId}`,
          maxUsers: Number(process.env.DEFAULT_ROOM_CAPACITY) || 20,
          isActive: true,
        });
        await room.save();
      }

      if ((room as any).isActive === false) {
        socket.emit("app-error", {
          message: "Phòng hiện đang bị tạm khóa bởi quản trị viên.",
        });
        return;
      }

      const existingUsersInRoom = Array.from(roomUsers.get(roomId) || [])
        .map((id) => connectedUsers.get(id))
        .filter(Boolean);
      const duplicateUser = existingUsersInRoom.find(
        (u) => u && u.username.toLowerCase().trim() === username.toLowerCase().trim()
      );
      if (duplicateUser) {
        socket.emit("app-error", {
          message: `Tên "${username}" đã được sử dụng trong phòng này. Vui lòng chọn tên khác.`,
        });
        return;
      }

      const currentUserCount = roomUsers.get(roomId)?.size || 0;
      if (currentUserCount >= room.maxUsers) {
        socket.emit("room-full", {
          message: `Phòng đã đầy (${room.maxUsers}/${room.maxUsers} người)`,
          maxUsers: room.maxUsers,
          currentUsers: currentUserCount,
        });
        return;
      }

      connectedUsers.set(socket.id, {
        userId,
        username: username.trim(),
        roomId,
        avatar,
        avatarConfig: avatarConfig || undefined,
        position: startPosition,
        socketId: socket.id,
      });

      const offlineKey = `${roomId}:${userId}`;
      const pending = pendingOfflineTimers.get(offlineKey);
      if (pending) {
        clearTimeout(pending);
        pendingOfflineTimers.delete(offlineKey);
        console.log(`✅ Cancelled pending offline for ${offlineKey}`);
      }

      // One user = one connection: remove any previous socket for this userId in this room (reconnect/tab duplicate)
      if (roomUsers.has(roomId)) {
        const toRemove: string[] = [];
        roomUsers.get(roomId)!.forEach((sid) => {
          if (connectedUsers.get(sid)?.userId === userId) toRemove.push(sid);
        });
        toRemove.forEach((sid) => {
          roomUsers.get(roomId)!.delete(sid);
          connectedUsers.delete(sid);
          io.sockets.sockets.get(sid)?.leave(roomId);
        });
      }
      if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Set());
      roomUsers.get(roomId)!.add(socket.id);
      socket.join(roomId);

      let roleToSet: "admin" | "member" = "member";
      try {
        const existingMember: any = await RoomMember.findOne({ roomId, userId }).select({ role: 1 }).lean();
        const roomHasAdmin = await RoomMember.exists({ roomId, role: "admin" });
        roleToSet = !roomHasAdmin ? "admin" : (existingMember?.role || "member");

        await RoomMember.findOneAndUpdate(
          { roomId, userId },
          {
            roomId,
            userId,
            username: username.trim(),
            avatar: avatar || username.trim().charAt(0).toUpperCase(),
            isOnline: true,
            lastSeen: new Date(),
            role: roleToSet,
            $setOnInsert: { joinedAt: new Date() },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );
        console.log(`Updated RoomMember ${userId} to online in room ${roomId}`);
      } catch (error: any) {
        if (error.code === 11000) {
          try {
            await RoomMember.findOneAndUpdate(
              { roomId, userId },
              { username: username.trim(), avatar: avatar || username.trim().charAt(0).toUpperCase(), isOnline: true, lastSeen: new Date() },
              { new: true }
            );
          } catch (updateError) {
            console.error("Error updating existing RoomMember:", updateError);
          }
        } else {
          console.error("Error saving RoomMember:", error);
        }
      }

      let allRoomMembers: any[] = [];
      try {
        const raw = await RoomMember.find({ roomId }).lean();
        // Dedupe by userId (defensive: unique index should prevent DB dupes)
        const byUserId = new Map<string, any>();
        raw.forEach((m: any) => byUserId.set(String(m.userId), m));
        allRoomMembers = Array.from(byUserId.values());
        const onlineUserIds = new Set(
          Array.from(roomUsers.get(roomId) || []).map((id) => connectedUsers.get(id)?.userId).filter(Boolean)
        );
        allRoomMembers = allRoomMembers.map((member) => ({ ...member, isOnline: onlineUserIds.has(member.userId) }));
      } catch (error) {
        console.error("Error loading RoomMembers:", error);
      }

      const usersMap = new Map();
      allRoomMembers.forEach((member: any) => {
        const connectedUser = Array.from(connectedUsers.values()).find((u) => u.userId === member.userId && u.roomId === roomId);
        usersMap.set(member.userId, {
          userId: member.userId,
          username: member.username,
          avatar: member.avatar,
          avatarConfig: (connectedUser as any)?.avatarConfig,
          position: connectedUser?.position || { x: 0, y: 0 },
          direction: connectedUser?.direction,
          status: member.isOnline ? "online" : "offline",
          role: member.role || "member",
        });
      });

      try {
        const admins = allRoomMembers.filter((m: any) => m.role === "admin");
        if (admins.length > 1) {
          const winner = admins.slice().sort((a: any, b: any) => {
            const aj = new Date(a.joinedAt || 0).getTime();
            const bj = new Date(b.joinedAt || 0).getTime();
            if (aj !== bj) return aj - bj;
            return String(a.userId).localeCompare(String(b.userId));
          })[0];
          const winnerId = winner.userId;
          await RoomMember.updateMany(
            { roomId, role: "admin", userId: { $ne: winnerId } },
            { $set: { role: "member" } }
          );
          io.to(roomId).emit("room-admin-changed", { roomId, newAdminUserId: winnerId });
          allRoomMembers = await RoomMember.find({ roomId }).lean();
          const onlineUserIds = new Set(
            Array.from(roomUsers.get(roomId) || []).map((id) => connectedUsers.get(id)?.userId).filter(Boolean)
          );
          allRoomMembers = allRoomMembers.map((m: any) => ({ ...m, isOnline: onlineUserIds.has(m.userId) }));
          usersMap.clear();
          allRoomMembers.forEach((member: any) => {
            const connectedUser = Array.from(connectedUsers.values()).find((u) => u.userId === member.userId && u.roomId === roomId);
            usersMap.set(member.userId, {
              userId: member.userId,
              username: member.username,
              avatar: member.avatar,
              avatarConfig: (connectedUser as any)?.avatarConfig,
              position: connectedUser?.position || { x: 0, y: 0 },
              direction: connectedUser?.direction,
              status: member.isOnline ? "online" : "offline",
              role: member.role || "member",
            });
          });
        }
      } catch (e) {
        console.error("Error normalizing room admins:", e);
      }

      const allUsersInRoom = Array.from(usersMap.values());
      console.log(`Broadcasting user-joined for ${username} (${userId}) to room ${roomId}`);

      io.to(roomId).emit("user-joined", {
        userId,
        username: username.trim(),
        avatar,
        avatarConfig: avatarConfig || undefined,
        position: startPosition,
        status: "online",
        role: roleToSet,
      });

      io.to(roomId).emit("room-users", allUsersInRoom);

      const allPlayersInRoom = Array.from(roomUsers.get(roomId) || [])
        .map((id) => {
          const u = connectedUsers.get(id);
          return u ? { userId: u.userId, username: u.username, avatar: u.avatar, avatarConfig: (u as any).avatarConfig, position: u.position, direction: u.direction } : null;
        })
        .filter(Boolean);

      socket.emit("allPlayersPositions", allPlayersInRoom);

      const finalUserCount = roomUsers.get(roomId)?.size || 0;
      io.to(roomId).emit("room-info", { roomId, currentUsers: finalUserCount, maxUsers: room.maxUsers });
      console.log(`${username.trim()} joined room ${roomId} (${finalUserCount}/${room.maxUsers})`);

      startBatchUpdateForRoom(roomId);
    } catch (error) {
      console.error("Error in user-join:", error);
      socket.emit("app-error", { message: "Failed to join room" });
    }
  });

  socket.on("reaction", (data: { reaction: string; timestamp?: number }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    io.to(user.roomId).emit("reaction", {
      userId: user.userId,
      reaction: data.reaction,
      timestamp: data.timestamp || Date.now(),
    });
  });

  socket.on("admin-kick-user", async (data: { targetUserId: string }) => {
    const adminUser = connectedUsers.get(socket.id);
    if (!adminUser) return;
    const { roomId, userId: adminUserId } = adminUser;
    const targetUserId = data?.targetUserId;
    if (!targetUserId) return;

    try {
      const adminMember = await RoomMember.findOne({ roomId, userId: adminUserId }).lean();
      if (!adminMember || (adminMember as any).role !== "admin") {
        socket.emit("app-error", { message: "Chỉ admin phòng mới có thể kick thành viên." });
        return;
      }
      if (targetUserId === adminUserId) {
        socket.emit("app-error", { message: "Không thể kick chính mình." });
        return;
      }

      const targetMember = await RoomMember.findOne({ roomId, userId: targetUserId }).lean();
      if (!targetMember) {
        socket.emit("app-error", { message: "Thành viên không tồn tại trong phòng." });
        return;
      }

      const targetSocketId = Array.from(roomUsers.get(roomId) || []).find(
        (sid) => connectedUsers.get(sid)?.userId === targetUserId
      );
      if (targetSocketId) {
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit("kicked-from-room", { roomId, message: "Bạn đã bị đưa ra khỏi phòng bởi admin." });
          roomUsers.get(roomId)?.delete(targetSocketId);
          connectedUsers.delete(targetSocketId);
          targetSocket.leave(roomId);
        }
      }

      await RoomMember.deleteOne({ roomId, userId: targetUserId });

      const rawMembers = await RoomMember.find({ roomId }).lean();
      const byUserId = new Map<string, any>();
      rawMembers.forEach((m: any) => byUserId.set(String(m.userId), m));
      const allRoomMembers = Array.from(byUserId.values());
      const onlineUserIds = new Set(
        Array.from(roomUsers.get(roomId) || []).map((id) => connectedUsers.get(id)?.userId).filter(Boolean)
      );
      const membersMap = new Map<string, any>();
      allRoomMembers.forEach((member: any) => {
        const connectedUser = Array.from(connectedUsers.values()).find((u) => u.userId === member.userId && u.roomId === roomId);
        membersMap.set(member.userId, {
          userId: member.userId,
          username: member.username,
          avatar: member.avatar,
          position: connectedUser?.position || { x: 0, y: 0 },
          direction: connectedUser?.direction,
          status: onlineUserIds.has(member.userId) ? "online" : "offline",
          role: member.role || "member",
        });
      });
      io.to(roomId).emit("room-users", Array.from(membersMap.values()));

      const room = await Room.findOne({ roomId }).lean();
      const finalCount = roomUsers.get(roomId)?.size || 0;
      if (room) io.to(roomId).emit("room-info", { roomId, currentUsers: finalCount, maxUsers: (room as any).maxUsers });
    } catch (err) {
      console.error("admin-kick-user error:", err);
      socket.emit("app-error", { message: "Không thể kick thành viên." });
    }
  });

  socket.on("disconnect", async () => {
    const user = connectedUsers.get(socket.id);
    if (!user) {
      console.log(`Socket ${socket.id} disconnected but was not in connectedUsers`);
      return;
    }

    const userId = user.userId;
    const roomId = user.roomId;
    const username = user.username;

    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId)!.delete(socket.id);
      if (roomUsers.get(roomId)!.size === 0) roomUsers.delete(roomId);
    }
    connectedUsers.delete(socket.id);

    const remainingInRoom = Array.from(roomUsers.get(roomId) || [])
      .map((id) => connectedUsers.get(id))
      .filter((u) => u && u.userId === userId);
    const hasOtherConnections = remainingInRoom.length > 0;

    voiceChannels.forEach((channelUsers, channelId) => {
      if (channelUsers.has(userId)) {
        channelUsers.delete(userId);
        if (channelUsers.size === 0) voiceChannels.delete(channelId);
        io.to(roomId).emit("voice-channel-update", { channelId, users: Array.from(channelUsers) });
      }
    });
    userActiveVoiceChannel.delete(`${roomId}:${userId}`);

    if (!hasOtherConnections) {
      const offlineKey = `${roomId}:${userId}`;
      const existingTimer = pendingOfflineTimers.get(offlineKey);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(async () => {
        pendingOfflineTimers.delete(offlineKey);
        const reconnected = Array.from(roomUsers.get(roomId) || [])
          .map((id) => connectedUsers.get(id))
          .some((u) => u && u.userId === userId && u.roomId === roomId);
        if (reconnected) return;

        io.to(roomId).emit("user-left", { userId, username, timestamp: Date.now() });

        try {
          await RoomMember.findOneAndUpdate(
            { roomId, userId },
            { isOnline: false, lastSeen: new Date() },
            { new: false, runValidators: true }
          );

          try {
            const adminsLeft = await RoomMember.exists({ roomId, role: "admin", userId: { $ne: userId } });
            if (!adminsLeft) {
              const candidate = await RoomMember.findOne({ roomId, userId: { $ne: userId } }).sort({ isOnline: -1, joinedAt: 1 }).lean();
              if (candidate) {
                await RoomMember.findOneAndUpdate({ roomId, userId: (candidate as any).userId }, { role: "admin" });
                io.to(roomId).emit("room-admin-changed", { roomId, newAdminUserId: (candidate as any).userId });
              }
            }
          } catch (e) {
            console.error("Error ensuring room admin:", e);
          }

          try {
            const rawMembers = await RoomMember.find({ roomId }).lean();
            const byUserId = new Map<string, any>();
            rawMembers.forEach((m: any) => byUserId.set(String(m.userId), m));
            const allRoomMembers = Array.from(byUserId.values());
            const onlineUserIds = new Set(
              Array.from(roomUsers.get(roomId) || []).map((id) => connectedUsers.get(id)?.userId).filter((id): id is string => id !== undefined)
            );
            const membersMap = new Map<string, any>();
            allRoomMembers.forEach((member: any) => {
              const connectedUser = Array.from(connectedUsers.values()).find((u) => u.userId === member.userId && u.roomId === roomId);
              membersMap.set(member.userId, {
                userId: member.userId,
                username: member.username,
                avatar: member.avatar,
                position: connectedUser?.position || { x: 0, y: 0 },
                direction: connectedUser?.direction,
                status: onlineUserIds.has(member.userId) ? "online" : "offline",
                role: member.role || "member",
              });
            });
            io.to(roomId).emit("room-users", Array.from(membersMap.values()));
          } catch (error) {
            console.error("Error broadcasting updated room members:", error);
          }
        } catch (error) {
          console.error("Error updating RoomMember on disconnect:", error);
        }
      }, 5000);
      pendingOfflineTimers.set(offlineKey, timer);
    }

    const finalUserCount = roomUsers.get(roomId)?.size || 0;
    if (roomUsers.has(roomId)) {
      try {
        const room = await Room.findOne({ roomId });
        if (room) io.to(roomId).emit("room-info", { roomId, currentUsers: finalUserCount, maxUsers: room.maxUsers });
      } catch (error) {
        console.error("Error updating room info on disconnect:", error);
      }
    }

    if (roomUsers.has(roomId) && roomUsers.get(roomId)!.size === 0) {
      const interval = batchUpdateIntervals.get(roomId);
      if (interval) {
        clearInterval(interval);
        batchUpdateIntervals.delete(roomId);
      }
    }

    console.log(`${username} (${userId}) disconnected`);
  });
}
