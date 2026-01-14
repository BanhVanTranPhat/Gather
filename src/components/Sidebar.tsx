import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { InviteModal } from "./modals";
import NotificationCenter from "./NotificationCenter";

const Sidebar = () => {
  const { users, currentUser, isConnected, socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Xác định tab active dựa trên route hiện tại
  const getActiveTab = () => {
    if (location.pathname === "/app/chat") return "chat";
    if (location.pathname.includes("/app")) return "users";
    return "users";
  };

  const [activeTab, setActiveTab] = useState<"users" | "chat">(getActiveTab());

  // Đồng bộ activeTab khi location thay đổi
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Gộp danh sách user giống panel chat: 1 bản duy nhất theo username, ưu tiên online
  const {
    onlineUsers,
    offlineUsers,
    filteredOnlineUsers,
    filteredOfflineUsers,
  } = (() => {
    const byUsername = new Map<
      string,
      (typeof users)[0] | typeof currentUser | null | undefined
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
        byUsername.set(currentUser.username, {
          ...currentUser,
          status: "online" as const,
        });
      }
    }

    const merged = Array.from(byUsername.values()).filter(
      (u): u is NonNullable<typeof u> => !!u
    );

    const online = merged.filter((u) => (u as any).status !== "offline");
    const offline = merged.filter((u) => (u as any).status === "offline");

    const filteredOnline = online.filter((u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredOffline = offline.filter((u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      onlineUsers: online,
      offlineUsers: offline,
      filteredOnlineUsers: filteredOnline,
      filteredOfflineUsers: filteredOffline,
    };
  })();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const roomId = localStorage.getItem("roomId") || "default-room";

  const handleExit = () => {
    // Disconnect socket before navigating to ensure backend receives disconnect event
    // This will trigger user-left event and update user status to offline
    if (socket) {
      console.log("Disconnecting socket before exit...");
      socket.disconnect();
    }
    // Clear local storage
    localStorage.removeItem("roomId");
    localStorage.removeItem("userId");
    // Navigate to spaces
    navigate("/spaces");
  };

  const handleTabClick = (tab: "users" | "chat") => {
    setActiveTab(tab);
    if (tab === "chat") {
      navigate("/app/chat");
    } else {
      navigate("/app");
    }
  };

  const projectName = "My Virtual Office";

  return (
    <div
      className={`w-80 h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 flex overflow-hidden transition-all duration-300 shadow-[2px_0_8px_rgba(0,0,0,0.08)] ${
        activeTab !== "users" ? "w-[57px]" : ""
      }`}
    >
      {/* Vertical Navigation Strip */}
      <div className="w-14 bg-gradient-to-b from-gray-50 to-white flex flex-col items-center py-4 gap-3 flex-shrink-0 border-r border-gray-200/50">
        <button
          className={`w-11 h-11 flex items-center justify-center bg-transparent border-none rounded-xl cursor-pointer text-xl transition-all duration-200 shadow-sm ${
            activeTab === "users"
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)] scale-105"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 hover:scale-105"
          }`}
          onClick={() => handleTabClick("users")}
          title="People"
        >
          🗺️
        </button>
        <button
          className={`w-11 h-11 flex items-center justify-center bg-transparent border-none rounded-xl cursor-pointer text-xl transition-all duration-200 shadow-sm ${
            activeTab === "chat"
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)] scale-105"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 hover:scale-105"
          }`}
          onClick={() => handleTabClick("chat")}
          title="Chat"
        >
          💬
        </button>
      </div>

      {/* Notification Center */}
      <div className="sidebar-notifications">
        <NotificationCenter />
      </div>

      {/* Main Sidebar Panel - Only show for Users tab */}
      {activeTab === "users" && (
        <div className="flex-1 flex flex-col overflow-y-auto min-w-[263px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-400">
          <div className="px-5 py-5 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm flex justify-between items-center shadow-sm">
            <h2 className="m-0 text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {projectName}
            </h2>
            <NotificationCenter />
          </div>

          <div className="px-5 py-5 border-b border-gray-100/60 bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
            <h3 className="m-0 mb-2 text-sm font-bold text-gray-900 tracking-tight">
              Experience Gather together
            </h3>
            <p className="m-0 mb-4 text-sm text-gray-600 leading-relaxed">
              Invite your closest collaborators.
            </p>
            <button
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setShowInviteModal(true)}
            >
              Invite
            </button>
          </div>

          <div className="px-5 py-4 border-b border-gray-100/60 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search people"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                Ctrl F
              </span>
            </div>
          </div>

          {/* Online Users Panel - Trực tuyến */}
          <div className="flex-1 flex flex-col overflow-y-auto px-5 py-5">
            <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <span>Trực tuyến ({onlineUsers.length}/20)</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {filteredOnlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 hover:shadow-sm hover:translate-x-1 group"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-all">
                      {user.avatar}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-[2.5px] border-white shadow-[0_2px_4px_rgba(34,197,94,0.4)]"></div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {user.username}
                    </span>
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Online
                    </span>
                  </div>
                  <button
                    className="bg-transparent border border-gray-200 rounded-lg w-7 h-7 flex items-center justify-center cursor-pointer text-gray-500 text-sm font-bold transition-all duration-200 flex-shrink-0 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 hover:scale-110 hover:rotate-90"
                    onClick={() => {
                      // Follow functionality
                      console.log("Follow", user.userId);
                    }}
                    title="Follow"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Offline Users Panel - Ngoại tuyến */}
          {filteredOfflineUsers.length > 0 && (
            <div className="flex flex-col px-5 py-5 border-t border-gray-200/60 bg-gradient-to-b from-gray-50/50 to-white">
              <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
                <span>Ngoại tuyến ({offlineUsers.length})</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {filteredOfflineUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 opacity-75 hover:opacity-100 hover:bg-gray-100/60 hover:shadow-sm hover:translate-x-1 group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                        {user.avatar}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-gray-400 border-[2.5px] border-white shadow-sm"></div>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                        {user.username}
                      </span>
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Offline
                      </span>
                    </div>
                    <button
                      className="bg-transparent border border-gray-200 rounded-lg w-7 h-7 flex items-center justify-center cursor-pointer text-gray-400 text-sm font-bold transition-all duration-200 flex-shrink-0 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-600 hover:scale-110 hover:rotate-90"
                      onClick={() => {
                        // Follow functionality
                        console.log("Follow", user.userId);
                      }}
                      title="Follow"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto px-5 py-4 border-t border-gray-200/60 flex flex-col gap-3 bg-gradient-to-b from-white to-gray-50/50 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <div
                className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                  isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                }`}
              />
              <span className={isConnected ? "text-green-600" : "text-red-500"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <button
              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleExit}
            >
              Thoát
            </button>
          </div>
        </div>
      )}

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={roomId}
      />
    </div>
  );
};

export default Sidebar;
