import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useChat } from "../contexts/ChatContext";
import { useTheme } from "../contexts/ThemeContext";
import { InviteModal, CreateChannelModal } from "../components/modals";
import { ServerList, ChannelList, ChatArea, UserList } from "../components/chat/index";
import VoiceChannelView from "../components/chat/VoiceChannelView";
import SpacesManager from "../components/chat/SpacesManager";

type DirectMessage = {
  userId: string;
  username: string;
  avatar: string;
};

interface ChatPageProps {
  asPanel?: boolean;
  /** Full-page workspace chat (Discord-style): Room list | Channels | Chat | Members */
  fullPage?: boolean;
  /** When fullPage, pass current roomId (from parent state) */
  roomId?: string;
  /** When fullPage, call to switch room */
  onSwitchRoom?: (roomId: string, roomName: string) => void;
}

const ChatPage = ({ asPanel, fullPage, roomId: roomIdProp, onSwitchRoom }: ChatPageProps = {}) => {
  const navigate = useNavigate();
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
    markChannelAsViewed,
    createChannel,
    reactToMessage,
    editMessage,
    deleteMessage,
  } = useChat();

  const [selectedChannel, setSelectedChannel] = useState<string>("general");
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [createChannelType, setCreateChannelType] = useState<"text" | "voice">("text");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserListOpen, setMobileUserListOpen] = useState(false);
  const [showRoomManagementModal, setShowRoomManagementModal] = useState(false);

  const roomId = roomIdProp ?? localStorage.getItem("roomId") ?? "default-room";
  const roomName = localStorage.getItem("roomName") || roomId;

  // Mark channel as viewed when selected
  useEffect(() => {
    if (activeTab === "global" && selectedChannel) {
      markChannelAsViewed(selectedChannel);
    }
  }, [activeTab, selectedChannel, markChannelAsViewed]);

  const directMessages: DirectMessage[] = useMemo(() => {
    const dmMap = new Map<string, DirectMessage & { status?: "online" | "offline" }>();

    users
      .filter((u) => u.userId !== currentUser?.userId)
      .forEach((u) => {
        const status = (u as any).status || "online";
        const existing = dmMap.get(u.username);

        if (!existing) {
          dmMap.set(u.username, {
            userId: u.userId,
            username: u.username,
            avatar: u.avatar,
            status,
          });
        } else {
          if (existing.status === "offline" && status === "online") {
            dmMap.set(u.username, {
              userId: u.userId,
              username: u.username,
              avatar: u.avatar,
              status,
            });
          }
        }
      });

    return Array.from(dmMap.values()).map(({ status: _status, ...rest }) => rest);
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
      return messages.filter((msg) => {
        return msg.type === "global" && msg.channelId === selectedChannel;
      });
    }
    return messages;
  }, [messages, activeTab, selectedDM, currentUser, selectedChannel]);

  const handleSendMessage = (content: string, replyToId?: string) => {
    if (activeTab === "global" && selectedChannel) {
      sendMessage(content, selectedChannel, replyToId);
    } else {
      sendMessage(content, undefined, replyToId);
    }
  };

  const usersForList = useMemo(() => {
    const byUsername = new Map<
      string,
      (typeof users)[0] | (typeof currentUser) | null | undefined
    >();

    users.forEach((u) => {
      if (!u) return;
      const existing = byUsername.get(u.username);
      const status = (u as any).status || "online";
      const existingStatus = (existing as any)?.status || "offline";

      if (!existing || (existingStatus === "offline" && status === "online")) {
        byUsername.set(u.username, u);
      }
    });

    if (currentUser) {
      const existing = byUsername.get(currentUser.username);
      const existingStatus = (existing as any)?.status || "offline";
      if (!existing || existingStatus === "offline") {
        byUsername.set(currentUser.username, { ...currentUser, status: "online" as const });
      }
    }

    const merged = Array.from(byUsername.values()).filter(
      (u): u is NonNullable<typeof u> => !!u
    );

    const sorted = merged.sort((a, b) => {
      if (a.userId === currentUser?.userId) return -1;
      if (b.userId === currentUser?.userId) return 1;
      const aStatus = (a as any).status || "online";
      const bStatus = (b as any).status || "online";
      if (aStatus !== bStatus) return aStatus === "online" ? -1 : 1;
      return a.username.localeCompare(b.username);
    });

    return sorted.map((user) => ({
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      status: ((user as any).status || "online") as "online" | "offline",
      role: ((user as any).role || "member") as "admin" | "member",
      currentVoiceChannel:
        currentVoiceChannel && user.userId === currentUser?.userId
          ? currentVoiceChannel
          : undefined,
    }));
  }, [users, currentUser, currentVoiceChannel]);

  return (
    <div className={`flex-1 flex flex-col bg-gather-hero font-sans text-slate-100 overflow-hidden relative selection:bg-gather-accent/30 ${asPanel ? "h-full min-h-0" : "h-screen"}`}>
      {/* Header: chỉ Room + Online + icon mở Quản lý phòng (modal), không tab */}
      <div className={`flex-shrink-0 bg-gather-hero-end/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-2 ${asPanel ? "px-3 py-1.5" : "px-4 py-2"}`}>
        <div className="flex items-center gap-2 text-sm text-slate-400 min-w-0">
          <span className="font-semibold text-white shrink-0">Phòng:</span>
          <span className="truncate">{roomName}</span>
          <span className="text-slate-500 shrink-0">·</span>
          <span className="shrink-0">Online: {[currentUser, ...users].filter(Boolean).reduce((set, u) => set.add(u!.userId), new Set<string>()).size}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowRoomManagementModal(true)}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Quản lý phòng"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative max-w-[1920px] mx-auto w-full shadow-2xl">
        {/* Sidebar: panel = compact; fullPage = Room list + Channels; else = Server + Channels */}
        {asPanel ? (
          <div className="w-[180px] shrink-0 z-10 flex flex-col bg-gather-hero-end/80 border-r border-white/10 overflow-hidden">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chat trong phòng</p>
            </div>
            <div className="flex flex-col gap-0.5 py-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedChannel("general");
                  setSelectedDM(null);
                  setActiveTab("global");
                }}
                className={`px-3 py-2 text-left text-sm font-medium rounded-lg mx-2 transition-colors ${
                  selectedChannel === "general" && !selectedDM ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                Chat chung
              </button>
              {voiceChannels?.length > 0 ? (
                voiceChannels.map((vc) => {
                  const isActive = currentVoiceChannel === vc.id;
                  return (
                    <button
                      key={vc.id}
                      type="button"
                      onClick={() => (isActive ? leaveVoiceChannel() : joinVoiceChannel(vc.id))}
                      className={`px-3 py-2 text-left text-sm font-medium rounded-lg mx-2 flex items-center gap-2 transition-colors ${
                        isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      {vc.name}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-slate-500 text-xs mx-2">Voice</div>
              )}
            </div>
          </div>
        ) : fullPage ? (
          <>
            {/* Chỉ hiện kênh của phòng hiện tại (1 phòng = 1 pixel office), không hiện danh sách chuyển phòng */}
            <div className="flex flex-row w-[280px] shrink-0 z-10 bg-[#2B2D31] border-r border-white/10 overflow-hidden">
              <ChannelList
                className={mobileMenuOpen ? "open" : ""}
                serverName={roomName}
                channels={channels || []}
                voiceChannels={voiceChannels || []}
                selectedChannelId={selectedChannel}
                currentVoiceChannelId={currentVoiceChannel}
                onChannelSelect={(id: string) => {
                  setSelectedChannel(id);
                  setSelectedDM(null);
                  setActiveTab("global");
                  markChannelAsViewed(id);
                  setMobileMenuOpen(false);
                }}
                onVoiceChannelJoin={(id: string) => {
                  if (currentVoiceChannel === id) leaveVoiceChannel();
                  else joinVoiceChannel(id);
                }}
                onCreateChannel={(type: "text" | "voice") => {
                  setCreateChannelType(type);
                  setShowCreateChannelModal(true);
                }}
                currentUser={currentUser ? { userId: currentUser.userId, username: currentUser.username, avatar: currentUser.avatar } : undefined}
              />
            </div>
          </>
        ) : (
        <div className="flex flex-row w-[320px] shrink-0 z-10 glass-panel border-r-0 rounded-r-2xl my-2 ml-2 overflow-hidden">
            <ServerList currentServerId="default" onServerSelect={(id: string) => console.log("Server selected:", id)} />
            <ChannelList
            className={mobileMenuOpen ? "open" : ""}
            serverName="My Virtual Office"
            channels={channels || []}
            voiceChannels={voiceChannels || []}
            selectedChannelId={selectedChannel}
            currentVoiceChannelId={currentVoiceChannel}
            onChannelSelect={(id: string) => {
                setSelectedChannel(id);
                setSelectedDM(null);
                setActiveTab("global");
                markChannelAsViewed(id);
                setMobileMenuOpen(false);
            }}
            onVoiceChannelJoin={(id: string) => {
                if (currentVoiceChannel === id) leaveVoiceChannel();
                else joinVoiceChannel(id);
            }}
            onCreateChannel={(type: "text" | "voice") => {
                setCreateChannelType(type);
                setShowCreateChannelModal(true);
            }}
            currentUser={currentUser ? { userId: currentUser.userId, username: currentUser.username, avatar: currentUser.avatar } : undefined}
            />
        </div>
        )}

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            currentVoiceChannel ? "mr-[380px]" : fullPage ? "mr-0" : "mr-2"
          } ${fullPage ? "" : "my-2 mx-2"} bg-gather-hero-end/90 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative`}
        >
          {/* Background Mesh Gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-gather-accent/10 via-transparent to-gather-accent/5 pointer-events-none" />

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
                attachments: msg.attachments,
              }))}
              currentUserId={currentUser?.userId}
              onSendMessage={(
                content: string,
                attachments?: Array<{
                  filename: string;
                  originalName: string;
                  mimeType: string;
                  size: number;
                  url: string;
                }>
              ) => {
                if (activeTab === "global" && selectedChannel) {
                  sendMessage(content, selectedChannel, undefined, attachments);
                } else {
                  sendMessage(content, undefined, undefined, attachments);
                }
              }}
              onReply={(messageId: string, content: string) => {
                handleSendMessage(content, messageId);
              }}
              onReact={reactToMessage}
              onEdit={editMessage}
              onDelete={deleteMessage}
              inputPlaceholder={
                activeTab === "dm" && currentDMUser
                  ? `Nhắn cho @${currentDMUser.username}`
                  : asPanel
                    ? "Nhắn tin trong phòng..."
                    : `Message #${selectedChannel || "general"}`
              }
            />
        </div>

        {/* Voice Channel View - Floating Sidebar */}
        {currentVoiceChannel && (
          <div className="absolute top-2 right-2 bottom-2 w-[360px] bg-gather-hero-end/95 backdrop-blur-2xl rounded-2xl border border-white/10 z-20 flex flex-col shadow-2xl animate-slideLeft">
            <VoiceChannelView
              channelId={currentVoiceChannel}
              channelName={
                voiceChannels.find((vc) => vc.id === currentVoiceChannel)?.name ||
                "Voice Channel"
              }
              onLeave={() => {
                leaveVoiceChannel();
                setSelectedChannel("general");
                setActiveTab("global");
              }}
            />
          </div>
        )}

        {/* Members column (Discord-style) when full page */}
        {fullPage && (
          <UserList
            users={usersForList}
            currentUserId={currentUser?.userId}
            searchQuery=""
            className="shrink-0"
          />
        )}
      </div>
      
      {showRoomManagementModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gather-hero border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Quản lý phòng</h2>
              <button
                type="button"
                onClick={() => setShowRoomManagementModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Đóng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SpacesManager />
            </div>
          </div>
        </div>
      )}

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
      />
      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        onCreateChannel={(name: string, type: "text" | "voice", description?: string, isPrivate?: boolean) => {
          createChannel(name, type, description, isPrivate);
          setShowCreateChannelModal(false);
        }}
        defaultType={createChannelType}
      />
    </div>
  );
};

export default ChatPage;

