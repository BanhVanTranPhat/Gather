import type { Server } from "socket.io";

export interface ConnectedUser {
  userId: string;
  username: string;
  roomId: string;
  avatar?: string;
  avatarConfig?: unknown;
  position: { x: number; y: number };
  direction?: string;
  socketId: string;
}

export type SocketRateHit = (key: string, windowMs: number, max: number) => {
  limited: boolean;
  retryAfterSec: number;
};

/** Creates the batch position update function and returns it. Call once at server init. */
export function createBatchUpdater(
  io: Server,
  connectedUsers: Map<string, ConnectedUser>,
  roomUsers: Map<string, Set<string>>,
  batchUpdateIntervals: Map<string, NodeJS.Timeout>
): (roomId: string) => void {
  return function startBatchUpdateForRoom(roomId: string) {
    if (batchUpdateIntervals.has(roomId)) return;

    const interval = setInterval(() => {
      const socketIds = roomUsers.get(roomId);
      if (!socketIds || socketIds.size === 0) {
        clearInterval(interval);
        batchUpdateIntervals.delete(roomId);
        return;
      }

      const allPlayersInRoom = Array.from(socketIds)
        .map((id) => {
          const u = connectedUsers.get(id);
          if (u) {
            return {
              userId: u.userId,
              username: u.username,
              avatar: u.avatar,
              avatarConfig: u.avatarConfig,
              position: u.position,
              direction: u.direction,
            };
          }
          return null;
        })
        .filter(Boolean);

      if (allPlayersInRoom.length > 0) {
        io.to(roomId).emit("allPlayersPositions", allPlayersInRoom);
      }
    }, 500);

    batchUpdateIntervals.set(roomId, interval);
  };
}
