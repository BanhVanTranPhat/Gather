import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { InviteModal } from "./modals";
import NotificationCenter from "./NotificationCenter";
import { UserAvatarDisplay } from "./UserAvatarDisplay";
import { getAvatarColor } from "../utils/avatar";

const Sidebar = () => {
  const { users, currentUser, isConnected, socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getActiveTab = () => {
    if (location.pathname === "/app/chat" || (location.pathname.includes("/app") && searchParams.get("chat") === "1")) return "chat";
    return "users";
  };

  const [activeTab, setActiveTab] = useState<"users" | "chat">(getActiveTab());

  // Sync activeTab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname, searchParams]);

  // Merge user list like chat panel: unique by username, prioritize online
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
  const roomName = typeof window !== "undefined" ? (localStorage.getItem("roomName") || roomId) : roomId;

  const handleExit = () => {
    if (socket) {
      console.log("Disconnecting socket before exit...");
      socket.disconnect();
    }
    localStorage.removeItem("roomId");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const handleTabClick = (tab: "users" | "chat") => {
    setActiveTab(tab);
    if (tab === "chat") {
      navigate("/app/chat");
    } else {
      navigate("/app");
    }
  };

  return (
    <div
      className={`h-screen bg-gather-hero/95 backdrop-blur-2xl text-slate-100 flex overflow-hidden transition-all duration-300 border-r border-white/10 ${
        activeTab !== "users" ? "w-[72px]" : "w-80"
      }`}
    >
      {/* Vertical Navigation Strip */}
      <div className="w-[72px] bg-black/20 flex flex-col items-center py-6 gap-4 flex-shrink-0 border-r border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gather-accent flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
            <span className="font-bold text-lg font-display">G</span>
        </div>

        <button
          className={`w-12 h-12 flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-all duration-200 group relative ${
            activeTab === "users"
              ? "bg-white/10 text-white shadow-[0_0_15px_rgba(26,188,156,0.3)]"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
          onClick={() => handleTabClick("users")}
          title="People"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {activeTab === "users" && <div className="absolute -right-[1px] top-2 bottom-2 w-1 rounded-l-full bg-gather-accent" />}
        </button>
        <button
          className={`w-12 h-12 flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-all duration-200 group relative ${
            activeTab === "chat"
              ? "bg-white/10 text-white shadow-[0_0_15px_rgba(26,188,156,0.3)]"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
          onClick={() => handleTabClick("chat")}
          title="Chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
           {activeTab === "chat" && <div className="absolute -right-[1px] top-2 bottom-2 w-1 rounded-l-full bg-gather-accent" />}
        </button>
      </div>

      {/* Main Sidebar Panel */}
      {activeTab === "users" && (
        <div className="flex-1 flex flex-col overflow-hidden animate-slideRight">
          {/* Header */}
          <div className="h-16 px-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h2 className="m-0 text-lg font-display font-semibold text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {roomName}
            </h2>
            <div className="transform scale-90">
             <NotificationCenter />
            </div>
          </div>

          {/* Invite Card */}
          <div className="p-4 mx-4 mt-4 mb-2 rounded-2xl bg-gather-accent/10 border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gather-accent/20 flex items-center justify-center flex-shrink-0 text-gather-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="m-0 mb-1 text-sm font-semibold text-white font-display">
                  Invite Peers
                </h3>
                <p className="m-0 text-[11px] text-slate-400 leading-relaxed font-light">
                  Share the link to invite others to this space.
                </p>
              </div>
            </div>
            <button
              className="w-full py-2 bg-white/10 hover:bg-gather-accent hover:text-white hover:border-gather-accent text-gather-accent border border-white/10 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 shadow-sm"
              onClick={() => setShowInviteModal(true)}
            >
              Copy Invite Link
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-gather-accent transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-gather-accent/50 focus:border-gather-accent/50 focus:bg-black/40 transition-all font-light"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto px-3 scrollbar-hide">
            {/* Online */}
            <div className="mb-4">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 font-display">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                Online — {onlineUsers.length}
              </div>
              
              <div className="flex flex-col gap-1">
                {filteredOnlineUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/5 group border border-transparent hover:border-white/5"
                  >
                    <div className="relative shrink-0">
                      <UserAvatarDisplay
                        avatar={user.avatar}
                        profileColor={getAvatarColor(user.userId)}
                        displayName={user.username}
                        size="sm"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-[2.5px] border-gather-hero" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-white transition-colors">
                        {user.username}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-emerald-500/80 font-medium">
                          Active now
                        </span>
                        {(user as any).role === "admin" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOnlineUsers.length === 0 && (
                   <div className="px-4 py-6 text-center opacity-40">
                      <p className="text-xs">No one is online</p>
                   </div>
                )}
              </div>
            </div>

            {/* Offline */}
            {offlineUsers.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 font-display">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  Offline — {offlineUsers.length}
                </div>
                 <div className="flex flex-col gap-1">
                  {filteredOfflineUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/5 group opacity-60 hover:opacity-100"
                    >
                      <div className="relative shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        <UserAvatarDisplay
                          avatar={user.avatar}
                          profileColor={getAvatarColor(user.userId)}
                          displayName={user.username}
                          size="sm"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-slate-200">
                          {user.username}
                        </span>
                        {(user as any).role === "admin" && (
                          <div className="mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm">
                              ADMIN
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Control */}
          <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3 text-xs font-medium">
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                 <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
                    {isConnected ? "Connected" : "Disconnected"}
                 </span>
               </div>
            </div>
            <button
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2"
              onClick={handleExit}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Rời phòng
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
