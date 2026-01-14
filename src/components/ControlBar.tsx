import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebRTC } from "../contexts/WebRTCContext";
import { useSocket } from "../contexts/SocketContext";
import { SettingsModal } from "./modals";
import ReactionPanel from "./ReactionPanel";
import NearbyChatPanel from "./chat/NearbyChatPanel";

const ControlBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio } =
    useWebRTC();
  const [showSettings, setShowSettings] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showNearbyChat, setShowNearbyChat] = useState(false);

  const isChatPage = location.pathname === "/app/chat";
  const isSidebarPage = isChatPage;

  const handleLeaveRoom = () => {
    if (confirm("Are you sure you want to leave the room?")) {
      // Disconnect socket
      if (socket) {
        console.log("Leaving room and disconnecting socket...");
        socket.disconnect();
      }
      // Clear local storage
      localStorage.removeItem("roomId");
      localStorage.removeItem("userId");
      // Navigate to spaces
      navigate("/spaces");
    }
  };

  return (
    <div
      className={`fixed flex items-center gap-2 p-2 px-3 bg-white/95 dark:bg-[rgba(30,30,30,0.95)] backdrop-blur-[20px] rounded-2xl border border-black/10 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.2)] z-[100] ${
        isSidebarPage
          ? "bottom-[calc(1rem+1rem+0.75rem+36px+0.5rem)] left-14 w-auto max-w-none transform-none justify-start gap-1.5"
          : "bottom-6 left-1/2 -translate-x-1/2"
      }`}
    >
      <div className="flex items-center gap-1.5 shrink-0 [&:not(:last-child)]:after:content-[''] [&:not(:last-child)]:after:w-px [&:not(:last-child)]:after:h-6 [&:not(:last-child)]:after:bg-black/10 dark:[&:not(:last-child)]:after:bg-white/10 [&:not(:last-child)]:after:ml-1">
        <button className="p-0 w-auto h-auto" title="Minimap">
          <div
            className={`w-12 h-8 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg overflow-hidden flex items-center justify-center transition-all hover:bg-black/6 dark:hover:bg-white/8 hover:border-black/15 dark:hover:border-white/15 ${
              isSidebarPage ? "w-11 h-7" : ""
            }`}
          >
            <div className="w-full h-full relative bg-transparent">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full text-white text-[6px] flex items-center justify-center shadow-[0_0_0_2px_rgba(88,101,242,0.2)]">
                P
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 [&:not(:last-child)]:after:content-[''] [&:not(:last-child)]:after:w-px [&:not(:last-child)]:after:h-6 [&:not(:last-child)]:after:bg-black/10 dark:[&:not(:last-child)]:after:bg-white/10 [&:not(:last-child)]:after:ml-1">
        <button
          className={`relative w-9 h-9 flex items-center justify-center bg-transparent border-none rounded-[10px] text-black/60 dark:text-white/70 cursor-pointer transition-all shrink-0 ${
            isSidebarPage ? "w-8 h-8" : ""
          } ${
            isVideoEnabled
              ? "bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600"
              : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95 hover:-translate-y-px"
          }`}
          onClick={toggleVideo}
          title="Toggle Video"
        >
          <svg
            className={isSidebarPage ? "w-4 h-4" : "w-[18px] h-[18px]"}
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

        <button
          className={`relative w-9 h-9 flex items-center justify-center bg-transparent border-none rounded-[10px] text-black/60 dark:text-white/70 cursor-pointer transition-all shrink-0 ${
            isSidebarPage ? "w-8 h-8" : ""
          } ${
            isAudioEnabled
              ? "bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600"
              : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95 hover:-translate-y-px"
          }`}
          onClick={toggleAudio}
          title="Toggle Audio"
        >
          <svg
            className={isSidebarPage ? "w-4 h-4" : "w-[18px] h-[18px]"}
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

        <button
          className={`relative w-9 h-9 flex items-center justify-center bg-transparent border-none rounded-[10px] text-black/60 dark:text-white/70 cursor-pointer transition-all shrink-0 text-lg leading-none ${
            isSidebarPage ? "w-8 h-8 text-base" : ""
          } ${
            showNearbyChat
              ? "bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600"
              : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95 hover:-translate-y-px"
          }`}
          onClick={() => setShowNearbyChat(!showNearbyChat)}
          title="Nearby Chat"
        >
          💬
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className={`relative w-9 h-9 flex items-center justify-center bg-transparent border-none rounded-[10px] text-black/60 dark:text-white/70 cursor-pointer transition-all shrink-0 text-lg leading-none ${
            isSidebarPage ? "w-8 h-8 text-base" : ""
          } ${
            showReactions
              ? "bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600"
              : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95 hover:-translate-y-px"
          }`}
          onClick={() => setShowReactions(!showReactions)}
          title="Send Reaction"
        >
          😀
        </button>

        <button
          className={`relative w-9 h-9 flex items-center justify-center bg-transparent border-none rounded-[10px] text-black/60 dark:text-white/70 cursor-pointer transition-all shrink-0 ${
            isSidebarPage ? "w-8 h-8" : ""
          } hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/90 dark:hover:text-white/95`}
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <svg
            className={isSidebarPage ? "w-4 h-4" : "w-[18px] h-[18px]"}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>

        <button
          className={`relative w-9 h-9 flex items-center justify-center bg-red-500/10 dark:bg-red-500/20 border-none rounded-[10px] text-red-500 dark:text-red-400 cursor-pointer transition-all shrink-0 ${
            isSidebarPage ? "w-8 h-8" : ""
          } hover:bg-red-500/15 dark:hover:bg-red-500/25 hover:text-red-600 dark:hover:text-red-300 hover:-translate-y-px`}
          onClick={handleLeaveRoom}
          title="Leave Room"
        >
          <svg
            className={isSidebarPage ? "w-4 h-4" : "w-[18px] h-[18px]"}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
        </button>
      </div>

      <ReactionPanel
        isOpen={showReactions}
        onClose={() => setShowReactions(false)}
      />

      <NearbyChatPanel
        isOpen={showNearbyChat}
        onClose={() => setShowNearbyChat(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default ControlBar;
