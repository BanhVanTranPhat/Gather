import { renderHook, act } from "@testing-library/react";
import { ChatProvider, useChat } from "../ChatContext";
import { SocketContext } from "../SocketContext";

const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SocketContext.Provider
    value={{
      socket: mockSocket as any,
      isConnected: true,
      users: [],
      currentUser: {
        userId: "user-1",
        username: "User",
        avatar: "U",
        position: { x: 0, y: 0 },
      },
    }}
  >
    <ChatProvider roomId="room-1">{children}</ChatProvider>
  </SocketContext.Provider>
);

describe("ChatContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as jest.Mock;
  });

  it("should send message and emit via socket", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      result.current.setActiveTab("global");
    });

    act(() => {
      result.current.sendMessage("Hello world");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("chat-message", expect.objectContaining({
      message: "Hello world",
      type: "global",
    }));
  });

  it("should not send empty messages", () => {
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      result.current.sendMessage("   ");
    });

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

