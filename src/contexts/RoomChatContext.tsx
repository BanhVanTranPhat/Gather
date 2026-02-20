/**
 * RoomChatContext – Chat chỉ ở cấp phòng (room-level).
 * Không DM, không đa kênh, không server switching.
 * Dùng cho Workspace (Virtual Co-Working MVP).
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useSocket } from "./SocketContext";
import {
  useChatMessages,
  useChatChannels,
  useChatReactions,
} from "../hooks";
import type { ChatMessage } from "./ChatContext";

export interface RoomChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  editedAt?: number;
  replyTo?: ChatMessage["replyTo"];
  reactions?: ChatMessage["reactions"];
  attachments?: ChatMessage["attachments"];
}

interface RoomChatContextType {
  messages: RoomChatMessage[];
  sendMessage: (
    content: string,
    replyToId?: string,
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>
  ) => void;
  participants: Array<{ userId: string; username: string; avatar: string }>;
  voiceChannels: Array<{ id: string; name: string; users: string[] }>;
  currentVoiceChannel: string | null;
  joinVoiceChannel: (channelId: string) => void;
  leaveVoiceChannel: () => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  typingUsers: string[];
  emitTyping: () => void;
}

const RoomChatContext = createContext<RoomChatContextType | undefined>(undefined);

export const useRoomChat = () => {
  const ctx = useContext(RoomChatContext);
  if (!ctx) throw new Error("useRoomChat must be used within RoomChatProvider");
  return ctx;
};

interface RoomChatProviderProps {
  children: ReactNode;
  roomId: string;
}

const TYPING_DURATION_MS = 3000;

export const RoomChatProvider = ({ children, roomId }: RoomChatProviderProps) => {
  const { users, currentUser, socket } = useSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const emitTypingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    messages: rawMessages,
    sendMessage: sendMessageHook,
    editMessage: editMessageHook,
    deleteMessage: deleteMessageHook,
    setMessages,
  } = useChatMessages({
    activeTab: "global",
    dmTarget: null,
    selectedGroupId: null,
    roomId,
  });

  const {
    voiceChannels,
    currentVoiceChannel,
    joinVoiceChannel,
    leaveVoiceChannel,
  } = useChatChannels(roomId);

  const { reactToMessage } = useChatReactions({ setMessages, roomId });

  useEffect(() => {
    if (!socket) return;
    const handleUserTyping = (data: { userId: string; username: string }) => {
      if (data.userId === currentUser?.userId) return;
      setTypingUsers((prev) => (prev.includes(data.username) ? prev : [...prev, data.username]));
      const key = data.userId;
      if (typingTimeoutRef.current[key]) clearTimeout(typingTimeoutRef.current[key]);
      typingTimeoutRef.current[key] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
        delete typingTimeoutRef.current[key];
      }, TYPING_DURATION_MS);
    };
    socket.on("user-typing", handleUserTyping);
    return () => {
      socket.off("user-typing", handleUserTyping);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
    };
  }, [socket, currentUser?.userId]);

  const emitTyping = useCallback(() => {
    if (!socket) return;
    if (emitTypingRef.current) clearTimeout(emitTypingRef.current);
    emitTypingRef.current = setTimeout(() => {
      socket.emit("typing");
      emitTypingRef.current = null;
    }, 300);
  }, [socket]);

  const messages: RoomChatMessage[] = rawMessages.filter(
    (m) => m.type === "global"
  );

  const sendMessage = useCallback(
    (
      content: string,
      replyToId?: string,
      attachments?: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
      }>
    ) => {
      sendMessageHook(content, "general", replyToId, attachments);
    },
    [sendMessageHook]
  );

  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      editMessageHook(messageId, newContent, roomId);
    },
    [editMessageHook, roomId]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      deleteMessageHook(messageId, roomId);
    },
    [deleteMessageHook, roomId]
  );

  const participants = (users || []).map((u) => ({
    userId: u.userId,
    username: u.username,
    avatar: u.avatar || u.username.charAt(0).toUpperCase(),
  }));

  const value: RoomChatContextType = {
    messages,
    sendMessage,
    participants,
    voiceChannels: voiceChannels.map((v) => ({
      id: v.id,
      name: v.name,
      users: v.users,
    })),
    currentVoiceChannel,
    joinVoiceChannel,
    leaveVoiceChannel,
    reactToMessage,
    editMessage,
    deleteMessage,
    typingUsers,
    emitTyping,
  };

  return (
    <RoomChatContext.Provider value={value}>
      {children}
    </RoomChatContext.Provider>
  );
};
