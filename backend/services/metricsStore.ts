/**
 * In-memory metrics for observability (admin dashboard).
 * Server sets realtime state refs after creating Socket.IO maps.
 */

type ConnectedUser = {
  userId: string;
  username: string;
  roomId: string;
  socketId: string;
};

let connectedUsersRef: Map<string, ConnectedUser> | null = null;
let roomUsersRef: Map<string, Set<string>> | null = null;
let voiceChannelsRef: Map<string, Set<string>> | null = null;

let reconnectCount = 0;

export function setRealtimeState(
  connectedUsers: Map<string, ConnectedUser>,
  roomUsers: Map<string, Set<string>>,
  voiceChannels: Map<string, Set<string>>
): void {
  connectedUsersRef = connectedUsers;
  roomUsersRef = roomUsers;
  voiceChannelsRef = voiceChannels;
}

export function incrementReconnectCount(): void {
  reconnectCount += 1;
}

export interface MetricsSnapshot {
  onlineUsers: number;
  activeRooms: number;
  activeVoiceChannels: number;
  reconnectCount: number;
  timestamp: string;
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const now = new Date().toISOString();
  if (!connectedUsersRef || !roomUsersRef || !voiceChannelsRef) {
    return {
      onlineUsers: 0,
      activeRooms: 0,
      activeVoiceChannels: 0,
      reconnectCount,
      timestamp: now,
    };
  }
  const onlineUsers = connectedUsersRef.size;
  const activeRooms = Array.from(roomUsersRef.entries()).filter(
    ([_, sockets]) => sockets.size > 0
  ).length;
  const activeVoiceChannels = Array.from(voiceChannelsRef.entries()).filter(
    ([_, userIds]) => userIds.size > 0
  ).length;
  return {
    onlineUsers,
    activeRooms,
    activeVoiceChannels,
    reconnectCount,
    timestamp: now,
  };
}
