import type { Server } from "socket.io";
import type { Socket } from "socket.io";
import type { ConnectedUser } from "../types.js";

export function registerMovementHandlers(
  io: Server,
  socket: Socket,
  connectedUsers: Map<string, ConnectedUser>
): void {
  socket.on("playerMovement", (data: { position?: { x: number; y: number }; x?: number; y?: number; direction?: string }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    user.position = data.position ?? { x: data.x ?? 0, y: data.y ?? 0 };
    user.direction = data.direction;

    socket.to(user.roomId).emit("playerMoved", {
      userId: user.userId,
      username: user.username,
      position: user.position,
      direction: user.direction,
    });
  });
}
