import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";

export type ChatTab = "nearby" | "global" | "dm";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  type: ChatTab;
  targetUserId?: string | null;
  timestamp: number;
}

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  activeTab: ChatTab;
  setActiveTab: (tab: ChatTab) => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  dmTarget: string | null;
  setDmTarget: (id: string | null) => void;
  isHistoryLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  roomId: string;
}

export const ChatProvider = ({ children, roomId }: ChatProviderProps) => {
  const { socket, currentUser } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("global");
  const [dmTarget, setDmTarget] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHistoryLoading] = useState(false);

  // Không lưu tin nhắn trước đây - chỉ hiển thị tin nhắn mới

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socket.on("chat-message", handleIncoming);

    return () => {
      socket.off("chat-message", handleIncoming);
    };
  }, [socket]);

  const filteredMessages = useMemo(() => {
    if (activeTab === "nearby") {
      return messages.filter((msg) => msg.type === "nearby");
    }
    if (activeTab === "global") {
      return messages.filter((msg) => msg.type === "global");
    }
    // DM
    return messages.filter((msg) => {
      if (msg.type !== "dm" || !currentUser) return false;
      if (!dmTarget) return false;
      const participants = [msg.userId, msg.targetUserId];
      return (
        participants.includes(currentUser.userId) &&
        participants.includes(dmTarget)
      );
    });
  }, [messages, activeTab, dmTarget, currentUser]);

  const sendMessage = (content?: string | null) => {
    if (!socket || !currentUser) return;
    const trimmed = (content ?? "").trim();
    if (!trimmed) return;

    const payload: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: currentUser.userId,
      username: currentUser.username,
      message: trimmed,
      type: activeTab === "dm" ? "dm" : activeTab,
      targetUserId: activeTab === "dm" ? dmTarget : undefined,
      timestamp: Date.now(),
    };

    socket.emit("chat-message", payload);
  };

  const toggleChat = () => setIsOpen((prev) => !prev);

  const value: ChatContextType = {
    isOpen,
    toggleChat,
    activeTab,
    setActiveTab,
    messages: filteredMessages,
    sendMessage,
    dmTarget,
    setDmTarget,
    isHistoryLoading,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

