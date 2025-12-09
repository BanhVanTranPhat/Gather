import { useState, useMemo, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useChat } from "../contexts/ChatContext";
import { useTheme } from "../contexts/ThemeContext";
import InviteModal from "../components/InviteModal";
import ServerList from "../components/chat/ServerList";
import ChannelList from "../components/chat/ChannelList";
import ChatArea from "../components/chat/ChatArea";
import UserList from "../components/chat/UserList";
import CreateChannelModal from "../components/chat/CreateChannelModal";
import "./ChatPage.css";

type DirectMessage = {
  userId: string;
  username: string;
  avatar: string;
};

const ChatPage = () => {
  const { users, currentUser } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const {
    activeTab,
    setActiveTab,
    messages,
    sendMessage,
    setDmTarget,
    channels,
    voiceChannels,
    joinVoiceChannel,
    leaveVoiceChannel,
    currentVoiceChannel,
    updateChannelUnread,
    createChannel,
    reactToMessage,
    editMessage,
    deleteMessage,
  } = useChat();
  // const {
  //   isVideoEnabled,
  //   isAudioEnabled,
  //   isScreenSharing,
  //   toggleVideo,
  //   toggleAudio,
  //   startScreenShare,
  //   stopScreenShare,
  // } = useWebRTC();

  const [selectedChannel, setSelectedChannel] = useState<string>("general");
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [createChannelType, setCreateChannelType] = useState<"text" | "voice">("text");

  // Get roomId from localStorage
  const roomId = localStorage.getItem("roomId") || "default-room";

  // Mark channel as viewed when selected
  useEffect(() => {
    if (selectedChannel) {
      updateChannelUnread(selectedChannel, 0);
    }
  }, [selectedChannel, updateChannelUnread]);

  const directMessages: DirectMessage[] = useMemo(() => {
    return users
      .filter((u) => u.userId !== currentUser?.userId)
      .map((u) => ({
        userId: u.userId,
        username: u.username,
        avatar: u.avatar,
      }));
  }, [users, currentUser]);

  useEffect(() => {
    if (selectedDM) {
      setDmTarget(selectedDM);
      setActiveTab("dm");
    } else {
      setDmTarget(null);
    }
  }, [selectedDM, setDmTarget, setActiveTab]);

  useEffect(() => {
    if (selectedChannel) {
      setActiveTab("global");
      setSelectedDM(null);
    }
  }, [selectedChannel, setActiveTab]);

  const currentChannel = channels?.find((ch) => ch.id === selectedChannel) || null;
  const currentDMUser = directMessages?.find((dm) => dm.userId === selectedDM) || null;

  const displayMessages = useMemo(() => {
    console.log("Filtering messages. activeTab:", activeTab, "selectedChannel:", selectedChannel, "total messages:", messages.length);
    
    if (activeTab === "dm" && selectedDM) {
      return messages.filter((msg) => {
        if (msg.type !== "dm") return false;
        const participants = [msg.userId, msg.targetUserId];
        return (
          participants.includes(currentUser?.userId || "") &&
          participants.includes(selectedDM)
        );
      });
    }
    if (activeTab === "global" && selectedChannel) {
      // Filter messages by channelId
      const filtered = messages.filter((msg) => {
        const matches = msg.type === "global" && msg.channelId === selectedChannel;
        if (!matches) {
          console.log("Message filtered out:", {
            id: msg.id,
            type: msg.type,
            channelId: msg.channelId,
            selectedChannel,
            username: msg.username,
            message: msg.message?.substring(0, 20) || ""
          });
        }
        return matches;
      });
      console.log("Filtered messages for channel", selectedChannel, ":", filtered.length);
      return filtered;
    }
    return messages;
  }, [messages, activeTab, selectedDM, currentUser, selectedChannel]);

  const handleSendMessage = (content: string, replyToId?: string) => {
    // Send message with channelId for global messages
    if (activeTab === "global" && selectedChannel) {
      sendMessage(content, selectedChannel, replyToId);
    } else {
      sendMessage(content, undefined, replyToId);
    }
  };

  // Prepare users for UserList - bao gồm cả currentUser và loại bỏ duplicates
  const usersForList = useMemo(() => {
    // Combine users và currentUser, loại bỏ duplicates
    const userMap = new Map<string, typeof users[0] | typeof currentUser>();
    
    // Add currentUser first (if exists) - always online
    if (currentUser) {
      userMap.set(currentUser.userId, { ...currentUser, status: "online" as const });
    }
    
    // Add all users from socket context (preserve their status)
    users.forEach((user) => {
      if (user) {
        userMap.set(user.userId, user);
      }
    });
    
    const allUsers = Array.from(userMap.values()).filter((u): u is NonNullable<typeof u> => u !== null && u !== undefined);
    
    // Sort: online users first, then offline; currentUser always first
    const sortedUsers = allUsers.sort((a, b) => {
      // CurrentUser always first
      if (a.userId === currentUser?.userId) return -1;
      if (b.userId === currentUser?.userId) return 1;
      
      // Then by status: online first
      const aStatus = (a as any).status || "online";
      const bStatus = (b as any).status || "online";
      if (aStatus === "online" && bStatus === "offline") return -1;
      if (aStatus === "offline" && bStatus === "online") return 1;
      
      // Then alphabetically
      return a.username.localeCompare(b.username);
    });
    
    // Map to UserList format
    return sortedUsers.map((user) => ({
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      status: ((user as any).status || "online") as "online" | "offline", // Preserve status from socket
      currentVoiceChannel: currentVoiceChannel && user.userId === currentUser?.userId 
        ? currentVoiceChannel 
        : undefined,
    }));
  }, [users, currentUser, currentVoiceChannel]);

  return (
    <div className="chat-page">
      {/* Theme Toggle Button */}
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={theme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      <div className="chat-page-content discord-layout">
        {/* Server List */}
        <ServerList
          currentServerId="default"
          onServerSelect={(id) => console.log("Server selected:", id)}
        />

        {/* Channel List */}
        <ChannelList
          serverName="My Virtual Office"
          channels={channels || []}
          voiceChannels={voiceChannels || []}
          selectedChannelId={selectedChannel}
          currentVoiceChannelId={currentVoiceChannel}
          onChannelSelect={(id) => {
            setSelectedChannel(id);
            setSelectedDM(null);
            setActiveTab("global");
          }}
          onVoiceChannelJoin={(id) => {
            if (currentVoiceChannel === id) {
              leaveVoiceChannel();
            } else {
              joinVoiceChannel(id);
            }
          }}
          onCreateChannel={(type) => {
            setCreateChannelType(type);
            setShowCreateChannelModal(true);
          }}
          currentUser={currentUser ? {
            userId: currentUser.userId,
            username: currentUser.username,
            avatar: currentUser.avatar,
          } : undefined}
        />

        {/* Chat Area */}
        <ChatArea
          channelName={
            activeTab === "dm" && currentDMUser
              ? currentDMUser.username
              : currentChannel?.name || selectedChannel || "general"
          }
          channelType={activeTab === "dm" ? "dm" : "text"}
          messages={displayMessages.map((msg) => ({
            id: msg.id,
            userId: msg.userId,
            username: msg.username,
            message: msg.message,
            timestamp: msg.timestamp,
            editedAt: msg.editedAt,
            replyTo: msg.replyTo,
            reactions: msg.reactions,
          }))}
          currentUserId={currentUser?.userId}
          onSendMessage={handleSendMessage}
          onReply={(messageId, content) => {
            // Reply with messageId
            handleSendMessage(content, messageId);
          }}
          onReact={reactToMessage}
          onEdit={editMessage}
          onDelete={deleteMessage}
          inputPlaceholder={
            activeTab === "dm" && currentDMUser
              ? `Nhắn @${currentDMUser.username}`
              : `Nhắn #${selectedChannel || "general"}`
          }
        />

        {/* User List */}
        <UserList
          users={usersForList}
          currentUserId={currentUser?.userId}
          onUserClick={(userId) => {
            setSelectedDM(userId);
            setSelectedChannel("");
            setActiveTab("dm");
          }}
        />

      </div>
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
      />
      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        onCreateChannel={(name, type, description) => {
          createChannel(name, type, description);
          setShowCreateChannelModal(false);
        }}
        defaultType={createChannelType}
      />
    </div>
  );
};

export default ChatPage;

