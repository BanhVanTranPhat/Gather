import Message from "../models/Message.js";

export const registerChatHandlers = ({
  io,
  socket,
  connectedUsers,
  roomUsers,
}) => {
  socket.on("chat-message", async (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const message = {
      id: data.id || `msg-${Date.now()}-${socket.id}`,
      userId: user.userId,
      username: user.username,
      message: data.message?.trim() || "",
      type: data.type || "global",
      targetUserId: data.targetUserId || null,
      timestamp: Date.now(),
    };

    if (!message.message) {
      return;
    }

    const recipients = [];

    if (message.type === "nearby") {
      const nearbyUsers = Array.from(roomUsers.get(user.roomId) || [])
        .map((id) => connectedUsers.get(id))
        .filter((u) => {
          if (!u || u.userId === user.userId) return false;
          const distance = Math.sqrt(
            Math.pow(u.position.x - user.position.x, 2) +
              Math.pow(u.position.y - user.position.y, 2)
          );
          return distance < 200;
        });

      nearbyUsers.forEach((recipient) => {
        if (recipient) {
          recipients.push(recipient.userId);
          io.to(recipient.socketId).emit("chat-message", message);
        }
      });
      // send back to sender
      socket.emit("chat-message", message);
    } else if (message.type === "global") {
      io.to(user.roomId).emit("chat-message", message);
      recipients.push(
        ...Array.from(roomUsers.get(user.roomId) || []).map((id) => {
          const recipient = connectedUsers.get(id);
          return recipient?.userId;
        })
      );
    } else if (message.type === "dm" && message.targetUserId) {
      const targetUser = Array.from(connectedUsers.values()).find(
        (u) =>
          u.userId === message.targetUserId && u.roomId === user.roomId
      );
      if (targetUser) {
        recipients.push(targetUser.userId);
        io.to(targetUser.socketId).emit("chat-message", message);
        socket.emit("chat-message", message);
      }
    }

    // Persist message
    try {
      await Message.create({
        roomId: user.roomId,
        senderId: user.userId,
        senderName: user.username,
        type: message.type,
        content: message.message,
        targetUserId: message.targetUserId,
        recipients: recipients.filter(Boolean),
        timestamp: message.timestamp,
      });
    } catch (error) {
      console.error("Failed to save message", error);
    }
  });
};


