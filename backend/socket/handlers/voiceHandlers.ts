import type { Server } from "socket.io";
import type { Socket } from "socket.io";
import type { ConnectedUser } from "../types.js";
import type { SocketRateHit } from "../types.js";

export interface VoiceHandlerState {
  connectedUsers: Map<string, ConnectedUser>;
  roomUsers: Map<string, Set<string>>;
  voiceChannels: Map<string, Set<string>>;
  userActiveVoiceChannel: Map<string, string>;
  socketRateHit: SocketRateHit;
}

export function registerVoiceHandlers(
  io: Server,
  socket: Socket,
  state: VoiceHandlerState
): void {
  const { connectedUsers, roomUsers, voiceChannels, userActiveVoiceChannel, socketRateHit } = state;

  socket.on("join-voice-channel", (data: { channelId: string; userId: string; roomId: string }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { channelId, userId, roomId } = data;
    const rl = socketRateHit(`join-voice:${roomId}:${userId}`, 10_000, 20);
    if (rl.limited) {
      socket.emit("app-error", { message: `Bạn thao tác voice quá nhanh. Thử lại sau ${rl.retryAfterSec}s` });
      return;
    }

    if (user.roomId !== roomId) return;

    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Set());
    }

    const userKey = `${roomId}:${userId}`;
    const prevChannelId = userActiveVoiceChannel.get(userKey);
    if (prevChannelId && prevChannelId !== channelId) {
      const prevSet = voiceChannels.get(prevChannelId);
      if (prevSet && prevSet.has(userId)) {
        prevSet.delete(userId);
        if (prevSet.size === 0) voiceChannels.delete(prevChannelId);
        io.to(roomId).emit("voice-channel-update", { channelId: prevChannelId, users: Array.from(prevSet || []) });
      }
    }

    const currentUsers = voiceChannels.get(channelId) || new Set<string>();
    if (!currentUsers.has(userId) && currentUsers.size >= 20) {
      socket.emit("voice-channel-full", { channelId, message: "Voice channel đã đầy (20 người)", maxUsers: 20 });
      return;
    }

    voiceChannels.get(channelId)!.add(userId);
    userActiveVoiceChannel.set(userKey, channelId);

    const channelUsers = Array.from(voiceChannels.get(channelId) || []);
    const updateData = { channelId, users: channelUsers };
    io.to(roomId).emit("voice-channel-update", updateData);
    socket.emit("voice-channel-update", updateData);
  });

  socket.on("leave-voice-channel", (data: { channelId: string; userId: string; roomId: string }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { channelId, userId, roomId } = data;
    const rl = socketRateHit(`leave-voice:${roomId}:${userId}`, 10_000, 20);
    if (rl.limited) {
      socket.emit("app-error", { message: `Bạn thao tác voice quá nhanh. Thử lại sau ${rl.retryAfterSec}s` });
      return;
    }

    const channel = voiceChannels.get(channelId);
    if (channel) {
      channel.delete(userId);
      if (channel.size === 0) voiceChannels.delete(channelId);
      io.to(roomId).emit("voice-channel-update", { channelId, users: Array.from(channel) });
    }

    const userKey = `${roomId}:${userId}`;
    if (userActiveVoiceChannel.get(userKey) === channelId) {
      userActiveVoiceChannel.delete(userKey);
    }
  });
}
