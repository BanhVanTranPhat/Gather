import { registerChatHandlers } from "../chatController.js";

describe("chatController", () => {
  it("should broadcast global messages", async () => {
    const io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const socket = {
      id: "socket-1",
      on: jest.fn((event, cb) => {
        if (event === "chat-message") {
          cb({
            type: "global",
            message: "Hello",
          });
        }
      }),
      emit: jest.fn(),
    };

    const connectedUsers = new Map([
      [
        "socket-1",
        {
          userId: "user-1",
          username: "Tester",
          roomId: "room-1",
          position: { x: 0, y: 0 },
        },
      ],
    ]);

    const roomUsers = new Map([["room-1", new Set(["socket-1"])]]); 

    registerChatHandlers({ io, socket, connectedUsers, roomUsers });

    expect(io.to).toHaveBeenCalledWith("room-1");
  });
});


