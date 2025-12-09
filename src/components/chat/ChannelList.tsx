import { useState } from "react";
import "./ChannelList.css";

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

interface ChannelListProps {
  serverName: string;
  channels: Channel[];
  voiceChannels?: VoiceChannel[];
  selectedChannelId: string | null;
  currentVoiceChannelId?: string | null;
  onChannelSelect: (id: string) => void;
  onVoiceChannelJoin?: (id: string) => void;
  onCreateChannel?: (type: "text" | "voice") => void;
  currentUser?: { userId: string; username: string; avatar?: string };
  onSearch?: () => void;
  onNewMessage?: () => void;
  onSettings?: () => void;
}

const ChannelList = ({
  serverName,
  channels,
  voiceChannels = [],
  selectedChannelId,
  currentVoiceChannelId,
  onChannelSelect,
  onVoiceChannelJoin,
  onCreateChannel,
  currentUser,
  onSearch,
  onNewMessage,
  onSettings,
}: ChannelListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const textChannels = channels.filter((ch) => ch.type === "text");
  const filteredTextChannels = textChannels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVoiceChannels = voiceChannels.filter((vc) =>
    vc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="channel-list-container">
      {/* Header */}
      <div className="channel-list-header">
        <h2 className="server-name">{serverName}</h2>
        <div className="channel-list-actions">
          {onSearch && (
            <button className="icon-btn" onClick={onSearch} title="Search">
              🔍
            </button>
          )}
          {onNewMessage && (
            <button className="icon-btn" onClick={onNewMessage} title="New Message">
              <span className="new-message-icon">□+</span>
            </button>
          )}
          {onSettings && (
            <button className="icon-btn" onClick={onSettings} title="Settings">
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="channel-list-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <span className="search-hint">Ctrl F</span>
      </div>

      {/* Events Section */}
      <div className="channel-section">
        <div
          className="section-header"
          onClick={() => toggleSection("events")}
        >
          <span className="section-toggle">
            {collapsedSections.has("events") ? "▶" : "▼"}
          </span>
          <h3 className="section-title">📅 Sự kiện</h3>
          <span className="section-badge">1</span>
        </div>
        {!collapsedSections.has("events") && (
          <div className="section-content">
            <div className="event-item">
              <span>• Event 1</span>
              <span className="event-badge">1</span>
            </div>
          </div>
        )}
      </div>

      {/* Text Channels Section */}
      <div className="channel-section">
        <div
          className="section-header"
          onClick={() => toggleSection("text")}
        >
          <span className="section-toggle">
            {collapsedSections.has("text") ? "▶" : "▼"}
          </span>
          <h3 className="section-title">💬 Kênh Chat</h3>
        </div>
        {!collapsedSections.has("text") && (
          <div className="section-content">
            {filteredTextChannels.map((channel) => (
              <div
                key={channel.id}
                className={`channel-item text-channel ${
                  selectedChannelId === channel.id ? "active" : ""
                }`}
                onClick={() => onChannelSelect(channel.id)}
              >
                <span className="channel-icon">#</span>
                <span className="channel-name">{channel.name}</span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="channel-unread">{channel.unreadCount}</span>
                )}
                {channel.unreadCount === 0 && selectedChannelId !== channel.id && (
                  <span className="channel-unread-dot">•</span>
                )}
              </div>
            ))}
            {onCreateChannel && (
              <button
                className="channel-item create-channel-btn"
                onClick={() => onCreateChannel("text")}
                title="Tạo kênh mới"
              >
                <span className="channel-icon">+</span>
                <span className="channel-name">Tạo kênh</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Voice Channels Section */}
      {voiceChannels.length > 0 && (
        <div className="channel-section">
          <div
            className="section-header"
            onClick={() => toggleSection("voice")}
          >
            <span className="section-toggle">
              {collapsedSections.has("voice") ? "▶" : "▼"}
            </span>
            <h3 className="section-title">🔊 Kênh đàm thoại</h3>
          </div>
          {!collapsedSections.has("voice") && (
            <div className="section-content">
              {filteredVoiceChannels.map((voiceChannel) => {
                const isCurrentChannel = currentVoiceChannelId === voiceChannel.id;
                return (
                  <div
                    key={voiceChannel.id}
                    className={`channel-item voice-channel ${
                      voiceChannel.isActive || isCurrentChannel ? "active" : ""
                    } ${isCurrentChannel ? "current-voice" : ""}`}
                    onClick={() => onVoiceChannelJoin?.(voiceChannel.id)}
                  >
                    <span className="voice-icon">🔊</span>
                    <span className="channel-name">{voiceChannel.name}</span>
                    {voiceChannel.users.length > 0 && (
                      <span className="voice-user-count">
                        [{voiceChannel.users.length}]
                      </span>
                    )}
                    {voiceChannel.duration && (
                      <span className="voice-duration">
                        {formatDuration(voiceChannel.duration)}
                      </span>
                    )}
                    {isCurrentChannel && (
                      <span className="current-voice-indicator" title="You are in this voice channel">
                        🎤
                      </span>
                    )}
                  </div>
                );
              })}
              {onCreateChannel && (
                <button
                  className="channel-item create-channel-btn voice-channel"
                  onClick={() => onCreateChannel("voice")}
                  title="Tạo kênh đàm thoại mới"
                >
                  <span className="voice-icon">+</span>
                  <span className="channel-name">Tạo kênh đàm thoại</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* User Footer */}
      {currentUser && (
        <div className="channel-list-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser.avatar || currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser.username}</div>
              <div className="user-status">Online</div>
            </div>
          </div>
          <div className="user-controls">
            <button className="control-btn" title="Microphone">🎤</button>
            <button className="control-btn" title="Headphones">🔊</button>
            <button className="control-btn" title="Settings">⚙️</button>
          </div>
        </div>
      )}
    </div>
  );
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export default ChannelList;

