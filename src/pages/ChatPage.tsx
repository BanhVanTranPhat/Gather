import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useChat } from "../contexts/ChatContext";
import InviteModal from "../components/InviteModal";
import "./ChatPage.css";

type Channel = {
  id: string;
  name: string;
  description?: string;
};

type DirectMessage = {
  userId: string;
  username: string;
  avatar: string;
};

const ChatPage = () => {
  const { users, currentUser } = useSocket();
  const {
    activeTab,
    setActiveTab,
    messages,
    sendMessage,
    dmTarget,
    setDmTarget,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("general");
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get roomId from localStorage
  const roomId = localStorage.getItem("roomId") || "default-room";
  const currentUserCount = users.length;
  const maxUsers = 20;

  const channels: Channel[] = [
    { id: "general", name: "general", description: "Share company-wide updates, wins, announcements" },
    { id: "social", name: "social", description: "Casual conversations and social interactions" },
  ];

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    if (activeTab === "dm" && !dmTarget) return;

    sendMessage(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDMs = directMessages.filter((dm) =>
    dm.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentChannel = channels.find((ch) => ch.id === selectedChannel);
  const currentDMUser = directMessages.find((dm) => dm.userId === selectedDM);

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
      return messages.filter((msg) => msg.type === "global");
    }
    return messages;
  }, [messages, activeTab, selectedDM, currentUser]);

  return (
    <div className="chat-page">
      <div className="chat-page-content">
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>My Virtual Office</h2>
            <div className="chat-sidebar-actions">
              <button className="icon-btn" title="Search">
                🔍
              </button>
              <button className="icon-btn" title="New Message">
                <span className="new-message-icon">□+</span>
              </button>
              <button className="icon-btn" title="Settings">
                ⚙️
              </button>
            </div>
          </div>

          <div className="chat-sidebar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search or navigate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-hint">Ctrl F</span>
          </div>

          <div className="chat-sidebar-section invite-section">
            <div className="invite-box">
              <h3>Experience Gather together</h3>
              <p className="invite-subtitle">Invite your closest collaborators.</p>
              <div className="invite-preview">
                {directMessages.slice(0, 4).map((dm, idx) => (
                  <div key={dm.userId} className="invite-avatar">
                    {dm.avatar}
                  </div>
                ))}
                {directMessages.length > 4 && (
                  <div className="invite-avatar more">+{directMessages.length - 4}</div>
                )}
              </div>
              <div className="invite-actions">
                <button
                  className="invite-button"
                  onClick={() => setShowInviteModal(true)}
                  disabled={currentUserCount >= maxUsers}
                  title={currentUserCount >= maxUsers ? "Phòng đã đầy" : "Mời người tham gia"}
                >
                  👤 Invite
                </button>
                <button
                  className="invite-link-btn"
                  title="Copy invite link"
                  onClick={() => setShowInviteModal(true)}
                >
                  🔗
                </button>
              </div>
            </div>
          </div>

          <div className="chat-sidebar-section collapsible">
            <div className="section-header">
              <span>➤</span>
              <h3>Drafts</h3>
            </div>
          </div>

          <div className="chat-sidebar-section">
            <h3>Channels</h3>
            <div className="channel-list">
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className={`channel-item ${selectedChannel === channel.id ? "active" : ""
                    }`}
                  onClick={() => {
                    setSelectedChannel(channel.id);
                    setSelectedDM(null);
                    setActiveTab("global");
                  }}
                >
                  # {channel.name}
                </div>
              ))}
            </div>
          </div>

          <div className="chat-sidebar-section">
            <h3>Direct messages</h3>
            <div className="dm-list">
              {currentUser && (
                <div className="dm-item active">
                  <div className="dm-avatar">{currentUser.avatar}</div>
                  <span className="dm-name">
                    {currentUser.avatar.charAt(0).toUpperCase()}. {currentUser.username} (you)
                  </span>
                </div>
              )}
              {filteredDMs.map((dm) => (
                <div
                  key={dm.userId}
                  className={`dm-item ${selectedDM === dm.userId ? "active" : ""
                    }`}
                  onClick={() => {
                    setSelectedDM(dm.userId);
                    setSelectedChannel("");
                    setActiveTab("dm");
                  }}
                >
                  <div className="dm-avatar">{dm.avatar}</div>
                  <span className="dm-name">
                    {dm.avatar.charAt(0).toUpperCase()}. {dm.username}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-sidebar-footer">
            <button className="footer-icon-btn" title="Profile">P</button>
            <button className="footer-icon-btn" title="Settings">⚙️</button>
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-main-header">
            <div className="chat-main-title">
              {activeTab === "dm" && currentDMUser ? (
                <>
                  <span className="channel-icon">@</span>
                  <span>{currentDMUser.username}</span>
                </>
              ) : (
                <>
                  <span className="channel-icon">#</span>
                  <span>{selectedChannel || "general"}</span>
                </>
              )}
            </div>
            <div className="chat-main-actions">
              <div className="user-count">
                <span className="user-icon">P</span>
                <span>{users.length + (currentUser ? 1 : 0)}/20</span>
              </div>
              <div className="user-count">
                <span className="user-icon video-icon">24</span>
                <span>{users.length}</span>
              </div>
              <button className="icon-btn">⋯</button>
            </div>
          </div>

          {activeTab === "global" && currentChannel && (
            <div className="chat-welcome">
              <h2>
                <span className="speaker-icon">🔊</span>
                Gather round in #{currentChannel.name}
              </h2>
              <p className="welcome-description">▲ {currentChannel.description}</p>
              <div className="welcome-cards">
                <div className="welcome-card pink">
                  <div className="welcome-card-icon">👤</div>
                  <p>Tips to onboard your company into Gather</p>
                </div>
                <div className="welcome-card green">
                  <div className="welcome-card-icon">👥</div>
                  <p>See how other companies use Gather</p>
                </div>
              </div>
            </div>
          )}

          <div className="chat-messages-container">
            {displayMessages.length === 0 ? (
              <div className="chat-empty">
                {activeTab === "dm" ? (
                  <p>No messages yet. Start a conversation!</p>
                ) : (
                  <p>No messages in this channel yet.</p>
                )}
              </div>
            ) : (
              <>
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message-item ${msg.userId === currentUser?.userId ? "own" : ""
                      }`}
                  >
                    <div className="message-header">
                      <span className="message-avatar">{msg.username.charAt(0).toUpperCase()}</span>
                      <span className="message-username">{msg.username}</span>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${activeTab === "dm" && currentDMUser ? currentDMUser.username : selectedChannel || "general"}`}
              className="chat-message-input"
            />
            <div className="chat-input-toolbar">
              <button className="toolbar-btn" title="Mention">@</button>
              <button className="toolbar-btn" title="Emoji">😀</button>
              <button className="toolbar-btn" title="Bold">B</button>
              <button className="toolbar-btn" title="Italic">I</button>
              <button className="toolbar-btn" title="Strikethrough">S</button>
              <button className="toolbar-btn" title="Link">🔗</button>
              <button className="toolbar-btn" title="Bullet list">•</button>
              <button className="toolbar-btn" title="Numbered list">1.</button>
              <button className="toolbar-btn" title="Code block">{"</>"}</button>
              <button className="toolbar-btn" title="Quote">❝</button>
              <button className="toolbar-btn" title="Attachment">📎</button>
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                title="Send"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
      />
    </div>
  );
};

export default ChatPage;

