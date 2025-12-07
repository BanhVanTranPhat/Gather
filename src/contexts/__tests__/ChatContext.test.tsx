// @vitest-environment jsdom
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ChatProvider, useChat } from "../ChatContext";

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

// Mock useSocket hook
vi.mock("../SocketContext", () => ({
  useSocket: () => ({
    socket: mockSocket,
    isConnected: true,
    users: [],
    currentUser: {
      userId: "user-1",
      username: "User",
      avatar: "U",
      position: { x: 0, y: 0 },
    },
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatProvider roomId="room-1">{children}</ChatProvider>
);

describe("ChatContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;
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

