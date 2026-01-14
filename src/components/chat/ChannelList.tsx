import { useState } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useWebRTC } from "../../contexts/WebRTCContext";
import { useNotifications } from "../../contexts/NotificationContext";

// Hook for hover state per channel
const useChannelHover = () => {
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);
  return { hoveredChannelId, setHoveredChannelId };
};

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
  className?: string;
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
  className = "",
}: ChannelListProps) => {
  const { toggleChat } = useChat();
  const { isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio } =
    useWebRTC();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);

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
    <div
      className={`w-60 bg-gradient-to-b from-[#2f3136] to-[#202225] flex flex-col overflow-hidden shadow-[2px_0_8px_rgba(0,0,0,0.15)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#202225] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#1a1c1f] ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[#202225]/60 flex items-center justify-between bg-gradient-to-r from-[#2f3136] to-[#202225] h-14 box-border shadow-sm">
        <h2 className="m-0 text-[15px] font-bold text-[#dcddde] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex-1 flex items-center gap-2.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-gradient-to-br before:from-green-400 before:to-green-500 before:shrink-0 before:inline-block before:shadow-[0_0_8px_rgba(67,181,129,0.5)]">
          {serverName}
        </h2>
        <div className="flex gap-1.5 items-center">
          {onSearch && (
            <button
              className="bg-transparent border-none cursor-pointer text-base p-1.5 text-[#72767d] transition-all duration-200 flex items-center justify-center w-8 h-8 rounded-lg hover:text-[#dcddde] hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
              onClick={onSearch}
              title="Search"
            >
              🔍
            </button>
          )}
          {onNewMessage && (
            <button
              className="bg-transparent border-none cursor-pointer text-base p-1.5 text-[#72767d] transition-all duration-200 flex items-center justify-center w-8 h-8 rounded-lg hover:text-[#dcddde] hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
              onClick={onNewMessage}
              title="New Message"
            >
              <span className="text-sm font-semibold">□+</span>
            </button>
          )}
          {onSettings && (
            <button
              className="bg-transparent border-none cursor-pointer text-base p-1.5 text-[#72767d] transition-all duration-200 flex items-center justify-center w-8 h-8 rounded-lg hover:text-[#dcddde] hover:bg-[#3c3f44]/80 hover:scale-110 active:scale-95 shadow-sm"
              onClick={onSettings}
              title="Settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 relative flex items-center bg-[#2f3136]/50 backdrop-blur-sm">
        <span className="absolute left-5 text-[13px] text-[#72767d] z-10">
          🔍
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 pl-8 pr-9 bg-[#202225]/80 border border-[#202225] rounded-lg text-[13px] text-[#dcddde] transition-all duration-200 focus:outline-none focus:bg-[#1e1f22] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-[#72767d] shadow-sm"
        />
        <span className="absolute right-3 text-[11px] text-[#72767d] font-medium pointer-events-none bg-[#202225]/50 px-1.5 py-0.5 rounded">
          Ctrl F
        </span>
      </div>

      {/* Events Section */}
      <div className="mt-2 px-2">
        <div
          className="flex items-center gap-1 px-2 py-1 cursor-pointer select-none rounded transition-colors duration-150 hover:bg-[#3c3f44]"
          onClick={() => toggleSection("events")}
        >
          <span className="text-[10px] text-[#72767d] w-3 flex items-center justify-center">
            {collapsedSections.has("events") ? "▶" : "▼"}
          </span>
          <h3 className="m-0 text-xs font-bold text-[#72767d] uppercase tracking-wider flex-1">
            📅 Sự kiện
          </h3>
          <span className="text-[11px] text-[#72767d] font-semibold">1</span>
        </div>
        {!collapsedSections.has("events") && (
          <div className="py-1 flex flex-col gap-0.5">
            <div className="px-2 py-1.5 flex items-center justify-between text-sm text-[#96989d]">
              <span>• Event 1</span>
              <span className="bg-[#f04747] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-[10px] min-w-[18px] text-center">
                1
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Text Channels Section */}
      <div className="mt-2 px-2">
        <div
          className="flex items-center gap-1 px-2 py-1 cursor-pointer select-none rounded transition-colors duration-150 hover:bg-[#3c3f44]"
          onClick={() => toggleSection("text")}
        >
          <span className="text-[10px] text-[#72767d] w-3 flex items-center justify-center">
            {collapsedSections.has("text") ? "▶" : "▼"}
          </span>
          <h3 className="m-0 text-xs font-bold text-[#72767d] uppercase tracking-wider flex-1">
            💬 Kênh Chat
          </h3>
        </div>
        {!collapsedSections.has("text") && (
          <div className="py-1 flex flex-col gap-0.5">
            {filteredTextChannels.map((channel) => (
              <div
                key={channel.id}
                className={`px-3 py-2 rounded-lg cursor-pointer text-sm text-[#96989d] transition-all duration-200 flex items-center gap-2 font-semibold relative group ${
                  selectedChannelId === channel.id
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-[#dcddde] shadow-[0_2px_8px_rgba(99,102,241,0.2)] border-l-2 border-indigo-500"
                    : "hover:bg-[#3c3f44]/80 hover:text-[#dcddde] hover:translate-x-1"
                }`}
                onClick={() => onChannelSelect(channel.id)}
              >
                <span
                  className={`text-base ${
                    selectedChannelId === channel.id
                      ? "text-indigo-400"
                      : "text-[#72767d] group-hover:text-indigo-400"
                  } font-normal transition-colors`}
                >
                  #
                </span>
                <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  {channel.name}
                </span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse shadow-[0_2px_8px_rgba(239,68,68,0.4)]">
                    {channel.unreadCount}
                  </span>
                )}
                {channel.unreadCount === 0 &&
                  selectedChannelId !== channel.id && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full shrink-0 animate-pulse shadow-[0_0_4px_rgba(239,68,68,0.6)]">
                      •
                    </span>
                  )}
              </div>
            ))}
            {onCreateChannel && (
              <button
                className="px-2 py-1.5 rounded cursor-pointer text-sm text-[#72767d] transition-all duration-150 flex items-center gap-1.5 font-medium italic border-none bg-transparent hover:text-[#dcddde] hover:bg-[#3c3f44]"
                onClick={() => onCreateChannel("text")}
                title="Tạo kênh mới"
              >
                <span className="text-base text-[#72767d] font-normal">+</span>
                <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  Tạo kênh
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Voice Channels Section */}
      {voiceChannels.length > 0 && (
        <div className="mt-2 px-2">
          <div
            className="flex items-center gap-1 px-2 py-1 cursor-pointer select-none rounded transition-colors duration-150 hover:bg-[#3c3f44]"
            onClick={() => toggleSection("voice")}
          >
            <span className="text-[10px] text-[#72767d] w-3 flex items-center justify-center">
              {collapsedSections.has("voice") ? "▶" : "▼"}
            </span>
            <h3 className="m-0 text-xs font-bold text-[#72767d] uppercase tracking-wider flex-1">
              🔊 Kênh đàm thoại
            </h3>
          </div>
          {!collapsedSections.has("voice") && (
            <div className="py-1 flex flex-col gap-0.5">
              {filteredVoiceChannels.map((voiceChannel) => {
                const isCurrentChannel =
                  currentVoiceChannelId === voiceChannel.id;
                return (
                  <div
                    key={voiceChannel.id}
                    className={`px-2 py-1.5 pl-6 rounded cursor-pointer text-sm text-[#96989d] transition-all duration-150 flex items-center gap-1.5 font-medium ${
                      voiceChannel.isActive || isCurrentChannel
                        ? "bg-[#3c3f44] text-[#dcddde]"
                        : "hover:bg-[#3c3f44] hover:text-[#dcddde]"
                    }`}
                    onClick={() => onVoiceChannelJoin?.(voiceChannel.id)}
                  >
                    <span className="text-base">🔊</span>
                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {voiceChannel.name}
                    </span>
                    {voiceChannel.users.length > 0 && (
                      <span className="ml-auto text-xs text-[#72767d]">
                        [{voiceChannel.users.length}]
                      </span>
                    )}
                    {voiceChannel.duration && (
                      <span className="text-[11px] text-[#72767d] ml-1">
                        {formatDuration(voiceChannel.duration)}
                      </span>
                    )}
                    {isCurrentChannel && (
                      <span
                        className="ml-auto text-sm opacity-80"
                        title="You are in this voice channel"
                      >
                        🎤
                      </span>
                    )}
                  </div>
                );
              })}
              {onCreateChannel && (
                <button
                  className="px-2 py-1.5 pl-6 rounded cursor-pointer text-sm text-[#72767d] transition-all duration-150 flex items-center gap-1.5 font-medium italic border-none bg-transparent hover:text-[#dcddde] hover:bg-[#3c3f44]"
                  onClick={() => onCreateChannel("voice")}
                  title="Tạo kênh đàm thoại mới"
                >
                  <span className="text-base">+</span>
                  <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    Tạo kênh đàm thoại
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* User Footer - Integrated ControlBar */}
      {currentUser && (
        <div className="mt-auto p-2 bg-[#292b2f] border-t border-[#202225] flex items-center justify-between gap-2">
          {/* User Profile */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#5865f2] text-white flex items-center justify-center font-semibold text-sm shrink-0">
              {currentUser.avatar ||
                currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#dcddde] whitespace-nowrap overflow-hidden text-ellipsis">
                {currentUser.username}
              </div>
              {currentVoiceChannelId ? (
                <div className="text-[11px] text-[#5865f2] font-medium flex items-center gap-1">
                  <span className="text-xs shrink-0">🔊</span>
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                    {voiceChannels.find((vc) => vc.id === currentVoiceChannelId)
                      ?.name || "Voice Channel"}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-[#43b581] font-medium flex items-center gap-1 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#43b581] before:shrink-0 before:inline-block">
                  Online
                </div>
              )}
            </div>
          </div>

          {/* Controls Group */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Minimap */}
            <button
              className="relative w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md text-white/70 cursor-pointer transition-all duration-200 p-0 shrink-0 text-base"
              title="Minimap"
            >
              <div className="w-12 h-8 bg-black/30 border-none rounded-md overflow-hidden flex items-center justify-center">
                <div className="w-full h-full relative bg-transparent">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full text-[8px] flex items-center justify-center text-white">
                    P
                  </div>
                </div>
              </div>
            </button>

            {/* Video */}
            <button
              className={`relative w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md cursor-pointer transition-all duration-200 p-0 shrink-0 text-base ${
                isVideoEnabled
                  ? "bg-transparent text-amber-400 hover:text-amber-500 hover:bg-amber-400/10"
                  : "text-white/70 hover:bg-white/10 hover:text-white/90"
              }`}
              onClick={toggleVideo}
              title="Toggle Video"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {isVideoEnabled ? (
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                ) : (
                  <path d="M21 6.5l-4-4v3.5H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h13v3.5l4-4v-11z" />
                )}
              </svg>
            </button>

            {/* Audio */}
            <button
              className={`relative w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md cursor-pointer transition-all duration-200 p-0 shrink-0 text-base ${
                isAudioEnabled
                  ? "bg-transparent text-amber-400 hover:text-amber-500 hover:bg-amber-400/10"
                  : "text-white/70 hover:bg-white/10 hover:text-white/90"
              }`}
              onClick={toggleAudio}
              title="Toggle Audio"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {isAudioEnabled ? (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                ) : (
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4c-.83 0-1.5.67-1.5 1.5v3.18l3 3V5.5c0-.83-.67-1.5-1.5-1.5z" />
                )}
              </svg>
            </button>

            {/* Nearby Chat */}
            <button
              className="relative w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md text-white/70 cursor-pointer transition-all duration-200 p-0 shrink-0 text-base hover:bg-white/10 hover:text-white/90"
              title="Nearby chat"
              onClick={toggleChat}
            >
              💬
            </button>

            {/* Emoji/Reactions */}
            <button
              className="relative w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md text-white/70 cursor-pointer transition-all duration-200 p-0 shrink-0 text-base hover:bg-white/10 hover:text-white/90"
              title="Reactions"
            >
              😀
            </button>
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
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export default ChannelList;
