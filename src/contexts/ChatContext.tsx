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

export type ChatTab = "nearby" | "global" | "dm" | "group";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  type: ChatTab;
  targetUserId?: string | null;
  groupId?: string | null;
  channelId?: string | null; // For tracking which channel the message belongs to
  timestamp: number;
  editedAt?: number;
  replyTo?: {
    id: string;
    username: string;
    message: string;
  };
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

export interface GroupChat {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: number;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  category?: string;
  unreadCount?: number;
  description?: string;
}

export interface VoiceChannel {
  id: string;
  name: string;
  users: string[]; // userIds
  isActive: boolean;
  duration?: number; // in seconds
}

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  activeTab: ChatTab;
  setActiveTab: (tab: ChatTab) => void;
  messages: ChatMessage[];
  sendMessage: (
    content: string,
    channelId?: string,
    replyToId?: string,
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }>
  ) => void;
  dmTarget: string | null;
  setDmTarget: (id: string | null) => void;
  groupChats: GroupChat[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  createGroupChat: (name: string, memberIds: string[]) => void;
  isHistoryLoading: boolean;
  channels: Channel[];
  voiceChannels: VoiceChannel[];
  joinVoiceChannel: (channelId: string) => void;
  leaveVoiceChannel: () => void;
  currentVoiceChannel: string | null;
  updateChannelUnread: (channelId: string, count: number) => void;
  createChannel: (
    name: string,
    type: "text" | "voice",
    description?: string
  ) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
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
  const { socket, currentUser, users } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("global");
  const [dmTarget, setDmTarget] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isHistoryLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<string | null>(
    null
  );
  const [channelUnreads, setChannelUnreads] = useState<Map<string, number>>(
    new Map()
  );
  const [viewedChannels, setViewedChannels] = useState<Set<string>>(new Set());

  // Load messages from database when socket connects or channel changes
  useEffect(() => {
    if (!socket || !currentUser) return;

    const loadMessages = async () => {
      try {
        const roomId = localStorage.getItem("roomId") || "default-room";
        // Load all global messages (will be filtered by channelId in displayMessages)
        const response = await fetch(
          `${
            import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
          }/api/chat/history/${roomId}?type=global&limit=100`
        );
        if (response.ok) {
          const historyMessages: ChatMessage[] = await response.json();
          console.log("Loaded messages from database:", historyMessages.length);
          // Merge with existing messages, avoiding duplicates
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = historyMessages.filter(
              (m) => !existingIds.has(m.id)
            );
            return [...prev, ...newMessages].sort(
              (a, b) => a.timestamp - b.timestamp
            );
          });
        } else {
          console.warn(
            "Failed to load message history, continuing without history"
          );
        }
      } catch (error) {
        console.warn("Error loading message history (non-critical):", error);
        // Don't throw - allow app to continue without history
      }
    };

    loadMessages();
  }, [socket, currentUser]);

  useEffect(() => {
    if (!socket) {
      // Socket will be available after connection, this is expected during initial load
      return;
    }

    const handleIncoming = (message: ChatMessage) => {
      console.log("🔵 REAL-TIME: Received chat message:", message);
      console.log(
        "🔵 Message channelId:",
        message.channelId,
        "Message type:",
        message.type
      );
      console.log("🔵 Message content:", message.message?.substring(0, 50));
      console.log(
        "🔵 Message userId:",
        message.userId,
        "Current userId:",
        currentUser?.userId
      );

      setMessages((prev) => {
        // Deduplication: Check if message already exists
        if (prev.some((msg) => msg.id === message.id)) {
          // If message exists (e.g., from update), update it
          console.log("🔵 Updating existing message:", message.id);
          return prev
            .map((m) => (m.id === message.id ? message : m))
            .sort((a, b) => a.timestamp - b.timestamp);
        }
        // Add new message IMMEDIATELY (realtime)
        console.log(
          "🔵 Adding NEW message to list. Previous count:",
          prev.length,
          "New count:",
          prev.length + 1
        );
        const newMessages = [...prev, message].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        console.log("🔵 Total messages after add:", newMessages.length);
        console.log("🔵 New message added:", {
          id: message.id,
          channelId: message.channelId,
          type: message.type,
        });
        return newMessages;
      });
    };

    const handleMessageReactionUpdated = (data: {
      messageId: string;
      emoji: string;
      userId: string;
    }) => {
      console.log("🔵 REAL-TIME: Received message-reaction-updated:", data);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;

          const existingReactions = msg.reactions || [];
          const reactionIndex = existingReactions.findIndex(
            (r) => r.emoji === data.emoji
          );

          let newReactions: Array<{ emoji: string; users: string[] }>;

          if (reactionIndex >= 0) {
            const reaction = existingReactions[reactionIndex];
            const userIndex = reaction.users.indexOf(data.userId);

            if (userIndex >= 0) {
              // Remove reaction
              const newUsers = reaction.users.filter(
                (id) => id !== data.userId
              );
              if (newUsers.length === 0) {
                newReactions = existingReactions.filter(
                  (_, idx) => idx !== reactionIndex
                );
              } else {
                newReactions = [...existingReactions];
                newReactions[reactionIndex] = {
                  ...reaction,
                  users: newUsers,
                };
              }
            } else {
              // Add user to reaction
              newReactions = [...existingReactions];
              newReactions[reactionIndex] = {
                ...reaction,
                users: [...reaction.users, data.userId],
              };
            }
          } else {
            // Add new reaction
            newReactions = [
              ...existingReactions,
              { emoji: data.emoji, users: [data.userId] },
            ];
          }

          console.log("🔵 Updated message reactions:", {
            messageId: msg.id,
            reactions: newReactions,
          });
          return {
            ...msg,
            reactions: newReactions,
          };
        })
      );
    };

    const handleMessageEdited = (data: {
      messageId: string;
      newContent: string;
      editedAt: number;
      userId: string;
    }) => {
      console.log("🔵 REAL-TIME: Received message-edited:", data);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId && msg.userId === data.userId) {
            console.log("🔵 Updating message:", {
              messageId: msg.id,
              oldContent: msg.message?.substring(0, 30),
              newContent: data.newContent?.substring(0, 30),
            });
            return {
              ...msg,
              message: data.newContent,
              editedAt: data.editedAt,
            };
          }
          return msg;
        })
      );
    };

    const handleMessageDeleted = (data: {
      messageId: string;
      userId: string;
    }) => {
      console.log("🔵 REAL-TIME: Received message-deleted:", data);
      setMessages((prev) => {
        const filtered = prev.filter((msg) => {
          if (msg.id === data.messageId) {
            console.log("🔵 Removing message:", {
              messageId: msg.id,
              userId: msg.userId,
            });
            return msg.userId !== data.userId;
          }
          return true;
        });
        console.log("🔵 Messages after delete:", {
          before: prev.length,
          after: filtered.length,
        });
        return filtered;
      });
    };

    // ✅ FIX: Bind listeners directly without checking socket.connected
    // Socket.io allows binding listeners even when not connected - they will work when connection is established
    // This fixes the race condition where socket connects before listeners are bound
    console.log(
      "🔵 Setting up chat message listeners (socket.io will handle connection automatically)"
    );
    socket.on("chat-message", handleIncoming);
    socket.on("message-reaction-updated", handleMessageReactionUpdated);
    socket.on("message-edited", handleMessageEdited);
    socket.on("message-deleted", handleMessageDeleted);

    // ✅ CLEANUP FUNCTION
    return () => {
      console.log("🔴 Cleaning up chat message listeners");
      socket.off("chat-message", handleIncoming);
      socket.off("message-reaction-updated", handleMessageReactionUpdated);
      socket.off("message-edited", handleMessageEdited);
      socket.off("message-deleted", handleMessageDeleted);
    };
  }, [socket, currentUser]);

  const filteredMessages = useMemo(() => {
    if (activeTab === "nearby") {
      return messages.filter((msg) => msg.type === "nearby");
    }
    if (activeTab === "global") {
      return messages.filter((msg) => msg.type === "global");
    }
    if (activeTab === "group") {
      if (!selectedGroupId) return [];
      return messages.filter(
        (msg) => msg.type === "group" && msg.groupId === selectedGroupId
      );
    }
    // DM - Show messages where:
    // 1. Message type is "dm"
    // 2. Current user is either sender or receiver
    // 3. If dmTarget is selected, show only messages with that target
    // 4. If no dmTarget, show all DMs involving current user
    return messages.filter((msg) => {
      if (msg.type !== "dm" || !currentUser) return false;

      // Check if current user is involved in this DM
      const isSender = msg.userId === currentUser.userId;
      const isReceiver = msg.targetUserId === currentUser.userId;

      if (!isSender && !isReceiver) return false;

      // If dmTarget is selected, filter by it
      if (dmTarget) {
        // Show messages where dmTarget is either sender or receiver
        return msg.userId === dmTarget || msg.targetUserId === dmTarget;
      }

      // If no dmTarget selected, show all DMs involving current user
      return true;
    });
  }, [messages, activeTab, dmTarget, selectedGroupId, currentUser]);

  const sendMessage = useCallback(
    (
      content?: string | null,
      channelIdParam?: string,
      replyToId?: string,
      attachments?: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
      }>
    ) => {
      if (!socket || !currentUser) {
        console.warn(
          "Cannot send message: socket or currentUser not available"
        );
        return;
      }
      const trimmed = (content ?? "").trim();
      if (!trimmed && (!attachments || attachments.length === 0)) {
        console.warn("Cannot send empty message");
        return;
      }

      // Determine channelId based on activeTab or parameter
      let channelId: string | undefined = channelIdParam;
      if (activeTab === "global" && !channelId) {
        // Default to "general" if global and no channelId provided
        channelId = "general";
      }

      // Get replyTo info if replying
      let replyTo: ChatMessage["replyTo"] | undefined;
      if (replyToId) {
        const replyMsg = messages.find((m) => m.id === replyToId);
        if (replyMsg) {
          replyTo = {
            id: replyMsg.id,
            username: replyMsg.username,
            message: replyMsg.message,
          };
        }
      }

      const payload: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: currentUser.userId,
        username: currentUser.username,
        message: trimmed || "",
        type: activeTab === "dm" ? "dm" : activeTab,
        targetUserId: activeTab === "dm" ? dmTarget : undefined,
        groupId: activeTab === "group" ? selectedGroupId : undefined,
        channelId:
          channelId || (activeTab === "global" ? "general" : undefined), // Ensure channelId is set for global messages
        timestamp: Date.now(),
        reactions: [],
        replyTo,
        attachments: attachments || [],
      };

      console.log("Sending chat message:", {
        id: payload.id,
        channelId: payload.channelId,
        type: payload.type,
        activeTab,
        channelIdParam,
      });

      console.log("Sending chat message:", payload);
      socket.emit("chat-message", payload);

      // Optimistically add message to local state for immediate feedback
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === payload.id)) {
          return prev;
        }
        return [...prev, payload];
      });
    },
    [socket, currentUser, activeTab, dmTarget, selectedGroupId, messages]
  );

  const createGroupChat = useCallback(
    (name: string, memberIds: string[]) => {
      if (!socket || !currentUser) return;

      const groupId = `group-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const newGroup: GroupChat = {
        id: groupId,
        name,
        members: [currentUser.userId, ...memberIds],
        createdBy: currentUser.userId,
        createdAt: Date.now(),
      };

      socket.emit("create-group-chat", {
        groupId,
        name,
        members: newGroup.members,
        roomId,
      });

      setGroupChats((prev) => [...prev, newGroup]);
      setSelectedGroupId(groupId);
      setActiveTab("group");
    },
    [socket, currentUser, roomId]
  );

  // Listen for group chat events
  useEffect(() => {
    if (!socket) return;

    const handleGroupCreated = (group: GroupChat) => {
      setGroupChats((prev) => {
        if (prev.some((g) => g.id === group.id)) {
          return prev;
        }
        return [...prev, group];
      });
    };

    socket.on("group-chat-created", handleGroupCreated);

    return () => {
      socket.off("group-chat-created", handleGroupCreated);
    };
  }, [socket]);

  // Initialize default channels - chỉ có general và social
  useEffect(() => {
    const defaultChannels: Channel[] = [
      {
        id: "general",
        name: "general",
        type: "text",
        description: "Share company-wide updates, wins, announcements",
      },
      {
        id: "social",
        name: "social",
        type: "text",
        description: "Casual conversations and social interactions",
      },
    ];
    setChannels(defaultChannels);

    // Chỉ có 1 voice channel mặc định: Chat chung
    const defaultVoiceChannels: VoiceChannel[] = [
      { id: "general-voice", name: "Chat chung", users: [], isActive: false },
    ];
    setVoiceChannels(defaultVoiceChannels);
  }, []);

  // Update voice channels with real user data
  useEffect(() => {
    if (!currentUser) return;

    setVoiceChannels((prev) => {
      return prev.map((vc) => {
        // Find users currently in this voice channel
        // Note: User type from SocketContext doesn't have currentVoiceChannel property
        // We track voice channel membership via currentVoiceChannel state in ChatContext
        const usersInChannel: string[] = [];

        // Add current user if they're in this channel
        if (currentVoiceChannel === vc.id) {
          usersInChannel.push(currentUser.userId);
        }

        const allUsers = usersInChannel;

        return {
          ...vc,
          users: allUsers,
          isActive: allUsers.length > 0,
        };
      });
    });
  }, [users, currentUser, currentVoiceChannel]);

  // Listen for voice channel updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleVoiceChannelUpdate = (data: {
      channelId: string;
      users: string[];
    }) => {
      setVoiceChannels((prev) =>
        prev.map((vc) =>
          vc.id === data.channelId
            ? { ...vc, users: data.users, isActive: data.users.length > 0 }
            : vc
        )
      );
    };

    socket.on("voice-channel-update", handleVoiceChannelUpdate);

    return () => {
      socket.off("voice-channel-update", handleVoiceChannelUpdate);
    };
  }, [socket]);

  const leaveVoiceChannel = useCallback(() => {
    if (!socket || !currentUser || !currentVoiceChannel) return;

    const channelToLeave = currentVoiceChannel;

    socket.emit("leave-voice-channel", {
      channelId: channelToLeave,
      userId: currentUser.userId,
      roomId,
    });

    // Optimistically update local state
    setVoiceChannels((prev) =>
      prev.map((vc) =>
        vc.id === channelToLeave
          ? {
              ...vc,
              users: vc.users.filter((id) => id !== currentUser.userId),
              isActive:
                vc.users.filter((id) => id !== currentUser.userId).length > 0,
            }
          : vc
      )
    );

    setCurrentVoiceChannel(null);
  }, [socket, currentUser, roomId, currentVoiceChannel]);

  const joinVoiceChannel = useCallback(
    (channelId: string) => {
      if (!socket || !currentUser) return;

      // Leave current voice channel if any
      if (currentVoiceChannel && currentVoiceChannel !== channelId) {
        leaveVoiceChannel();
      }

      setCurrentVoiceChannel(channelId);

      // Emit to server
      socket.emit("join-voice-channel", {
        channelId,
        userId: currentUser.userId,
        roomId,
      });

      // Optimistically update local state
      setVoiceChannels((prev) =>
        prev.map((vc) =>
          vc.id === channelId
            ? {
                ...vc,
                users: vc.users.includes(currentUser.userId)
                  ? vc.users
                  : [...vc.users, currentUser.userId],
                isActive: true,
              }
            : vc
        )
      );
    },
    [socket, currentUser, roomId, currentVoiceChannel, leaveVoiceChannel]
  );

  const updateChannelUnread = useCallback(
    (channelId: string, count: number) => {
      setChannelUnreads((prev) => {
        const next = new Map(prev);
        if (count === 0) {
          next.delete(channelId);
        } else {
          next.set(channelId, count);
        }
        return next;
      });

      // Update channels with unread counts
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, unreadCount: count } : ch
        )
      );
    },
    []
  );

  // Update unread counts when messages arrive
  useEffect(() => {
    if (!currentUser) return;

    const unreadCounts = new Map<string, number>();

    messages.forEach((msg) => {
      // Only count unread for channels user hasn't viewed
      if (
        msg.type === "global" &&
        msg.channelId &&
        !viewedChannels.has(msg.channelId)
      ) {
        const current = unreadCounts.get(msg.channelId) || 0;
        unreadCounts.set(msg.channelId, current + 1);
      }
    });

    setChannelUnreads(unreadCounts);
  }, [messages, currentUser, viewedChannels]);

  // Expose function to mark channel as viewed
  const markChannelAsViewed = useCallback(
    (channelId: string) => {
      setViewedChannels((prev) => new Set(prev).add(channelId));
      updateChannelUnread(channelId, 0);
    },
    [updateChannelUnread]
  );

  const createChannel = useCallback(
    (name: string, type: "text" | "voice", description?: string) => {
      if (!socket || !currentUser) return;

      const channelId =
        type === "text"
          ? `channel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          : `voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      if (type === "text") {
        const newChannel: Channel = {
          id: channelId,
          name,
          type: "text",
          description,
        };
        setChannels((prev) => [...prev, newChannel]);

        // Emit to server
        socket.emit("create-channel", {
          channelId,
          name,
          type: "text",
          description,
          roomId,
        });
      } else {
        const newVoiceChannel: VoiceChannel = {
          id: channelId,
          name,
          users: [],
          isActive: false,
        };
        setVoiceChannels((prev) => [...prev, newVoiceChannel]);

        // Emit to server
        socket.emit("create-voice-channel", {
          channelId,
          name,
          roomId,
        });
      }
    },
    [socket, currentUser, roomId]
  );

  const reactToMessage = useCallback(
    (messageId: string, emoji: string) => {
      if (!socket || !currentUser) return;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;

          const existingReactions = msg.reactions || [];
          const reactionIndex = existingReactions.findIndex(
            (r) => r.emoji === emoji
          );

          let newReactions: Array<{ emoji: string; users: string[] }>;

          if (reactionIndex >= 0) {
            // Toggle reaction
            const reaction = existingReactions[reactionIndex];
            const userIndex = reaction.users.indexOf(currentUser.userId);

            if (userIndex >= 0) {
              // Remove reaction
              const newUsers = reaction.users.filter(
                (id) => id !== currentUser.userId
              );
              if (newUsers.length === 0) {
                // Remove reaction entirely if no users
                newReactions = existingReactions.filter(
                  (_, idx) => idx !== reactionIndex
                );
              } else {
                newReactions = [...existingReactions];
                newReactions[reactionIndex] = { ...reaction, users: newUsers };
              }
            } else {
              // Add user to reaction
              newReactions = [...existingReactions];
              newReactions[reactionIndex] = {
                ...reaction,
                users: [...reaction.users, currentUser.userId],
              };
            }
          } else {
            // Add new reaction
            newReactions = [
              ...existingReactions,
              { emoji, users: [currentUser.userId] },
            ];
          }

          return {
            ...msg,
            reactions: newReactions,
          };
        })
      );

      // Emit to server
      socket.emit("message-reaction", {
        messageId,
        emoji,
        userId: currentUser.userId,
        roomId,
      });
    },
    [socket, currentUser, roomId]
  );

  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      if (!socket || !currentUser) return;

      const trimmed = newContent.trim();
      if (!trimmed) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId && msg.userId === currentUser.userId
            ? { ...msg, message: trimmed, editedAt: Date.now() }
            : msg
        )
      );

      // Emit to server
      socket.emit("edit-message", {
        messageId,
        newContent: trimmed,
        userId: currentUser.userId,
        roomId,
      });
    },
    [socket, currentUser, roomId]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socket || !currentUser) return;

      // Optimistically remove message
      setMessages((prev) =>
        prev.filter((msg) => {
          if (msg.id === messageId) {
            // Only allow deletion of own messages
            return msg.userId !== currentUser.userId;
          }
          return true;
        })
      );

      // Emit to server
      socket.emit("delete-message", {
        messageId,
        userId: currentUser.userId,
        roomId,
      });
    },
    [socket, currentUser, roomId]
  );

  const toggleChat = () => setIsOpen((prev) => !prev);

  const channelsWithUnreads = useMemo(() => {
    return channels.map((ch) => ({
      ...ch,
      unreadCount: channelUnreads.get(ch.id) || ch.unreadCount || 0,
    }));
  }, [channels, channelUnreads]);

  const value: ChatContextType = {
    isOpen,
    toggleChat,
    activeTab,
    setActiveTab,
    messages: filteredMessages,
    sendMessage,
    dmTarget,
    setDmTarget,
    groupChats,
    selectedGroupId,
    setSelectedGroupId,
    createGroupChat,
    isHistoryLoading,
    channels: channelsWithUnreads,
    voiceChannels,
    joinVoiceChannel,
    leaveVoiceChannel,
    currentVoiceChannel,
    updateChannelUnread,
    createChannel,
    reactToMessage,
    editMessage,
    deleteMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
