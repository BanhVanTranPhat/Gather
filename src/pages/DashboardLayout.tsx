import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  ArrowRight,
  Book,
  Calendar,
  Layout,
  MessageCircle,
  LogOut,
  Settings,
  UserRoundPen,
  Video,
} from "lucide-react";
import { UserMenuPopup, EditProfileModal } from "../features/profile/ProfileModals";
import { authFetch } from "../utils/authFetch";

interface Props {
  onLogout: () => void;
  onEditAvatarRequest: () => void;
  onSettingsRequest: () => void;
  onEnterGame: () => void;
}

type DashboardView = "overview" | "forum" | "resources" | "events";
type DashboardNavView = DashboardView | "admin";

export const DashboardLayout = ({
  onLogout,
  onEditAvatarRequest,
  onSettingsRequest,
  onEnterGame,
}: Props) => {
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
  const [user, setUser] = useState<any>({
    displayName: 'Loading...',
    profileColor: '#87CEEB',
    avatarConfig: {},
  });

  const [activeView, setActiveView] = useState<DashboardNavView>("overview");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Load user từ localStorage trước để hiển thị ngay
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser((prev: any) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Failed to parse stored user:', e);
      }
    }
    
    // Sau đó fetch từ API để cập nhật
    const token = localStorage.getItem('token');
    if (token) {
      authFetch(`${serverUrl}/api/user/me`)
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data) {
            setUser((prev: any) => ({ ...prev, ...data }));
            // Lưu lại vào localStorage để giữ trạng thái
            localStorage.setItem('user', JSON.stringify(data));
          }
        })
        .catch(() => { });
    }
  }, [serverUrl]);

  const handleSaveProfile = (newName: string, newColor: string) => {
    setUser({ ...user, displayName: newName, profileColor: newColor });
    setShowEditModal(false);
  };

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const navItems = useMemo(() => {
    const base = [
      { id: "overview" as const, icon: Layout, label: "Overview" },
      { id: "forum" as const, icon: MessageCircle, label: "Forum" },
      { id: "resources" as const, icon: Book, label: "Library" },
      { id: "events" as const, icon: Calendar, label: "Events" },
    ] as const;

    return isAdmin
      ? ([
          ...base,
          { id: "admin" as const, icon: Shield, label: "Admin" },
        ] as const)
      : base;
  }, [isAdmin]);

  const goTo = (view: DashboardNavView) => {
    setActiveView(view);
    switch (view) {
      case "forum": {
        // Community = chat, but requires room context.
        const roomId = localStorage.getItem("roomId");
        navigate(roomId ? "/app/chat" : "/lobby");
        return;
      }
      case "resources":
        navigate("/library");
        return;
      case "events":
        // Events lives under /app (needs providers).
        navigate("/app/events");
        return;
      case "admin":
        navigate("/admin");
        return;
      default:
        return;
    }
  };

  const headerInfo = useMemo(() => {
    switch (activeView) {
      case "overview":
        return {
          title: `Welcome, ${user?.displayName || "there"}!`,
          desc: "Here's what's happening in The Gathering today.",
        };
      case "forum":
        return { title: "Community Forum", desc: "Join the conversation." };
      case "resources":
        return { title: "Digital Library", desc: "Explore curated resources." };
      case "events":
        return { title: "Events Booking", desc: "Book upcoming gatherings." };
      default:
        return { title: "Dashboard", desc: "" };
    }
  }, [activeView, user?.displayName]);

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar (icon-only like image #2) */}
      <aside className="w-16 h-screen flex-none bg-white/40 backdrop-blur-xl border-r border-white/20 hidden md:flex flex-col sticky top-0 items-center py-6 z-20">
        <div className="mb-8 px-4">
          <div className="bg-teal-600 w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-lg shadow-teal-100 select-none cursor-default">
            TG
          </div>
        </div>

        <nav className="flex-1 space-y-4 w-full px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              title={item.label}
              className={`flex items-center justify-center w-full aspect-square rounded-2xl transition-all cursor-pointer relative group ${
                activeView === item.id
                  ? "bg-teal-50 text-teal-600"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <item.icon size={20} />
              {activeView === item.id && (
                <motion.div
                  layoutId="sidebar-indicator-gather"
                  className="absolute left-[-14px] w-1.5 h-6 bg-teal-600 rounded-r-full"
                />
              )}

              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
                {item.label}
                <div className="absolute top-1/2 left-[-4px] transform -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-100 w-full px-3">
          <button
            onClick={onSettingsRequest}
            title="Settings"
            className="flex items-center justify-center w-full aspect-square text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-2xl transition-all cursor-pointer group relative"
          >
            <Settings size={20} />
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none shadow-xl">
              Settings
              <div className="absolute top-1/2 left-[-4px] transform -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 flex flex-col h-full min-h-0 overflow-hidden z-10 transition-all duration-300">
        {/* Top header pill */}
        <header className="flex justify-between items-center py-4 px-6 mb-4 bg-white/60 backdrop-blur-xl rounded-full border border-white/50 shadow-sm sticky top-0 z-50">
          <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
              {headerInfo.title}
            </h1>
            <p className="text-[11px] text-gray-500 font-bold mt-1.5 uppercase tracking-wider">
              {headerInfo.desc}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-1.5 rounded-full border border-white/50 shadow-sm transition-all hover:bg-white/80">
            <div className="text-right hidden sm:block px-2">
              <p className="text-xs font-black text-gray-900 tracking-tight">
                {user?.displayName}
              </p>
              <p className="text-[9px] text-teal-600 font-bold uppercase tracking-widest">
                {user?.role || "user"}
              </p>
            </div>

            {/* Quick actions: change avatar + logout */}
            <div className="hidden lg:flex items-center gap-1 pr-1">
              <button
                type="button"
                onClick={onEditAvatarRequest}
                className="h-8 px-3 rounded-full bg-white/70 hover:bg-white text-slate-700 border border-white/60 shadow-sm transition-all active:scale-95 inline-flex items-center gap-2"
                title="Đổi avatar"
              >
                <UserRoundPen size={16} />
                <span className="text-xs font-black">Đổi avatar</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="h-8 px-3 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 shadow-sm transition-all active:scale-95 inline-flex items-center gap-2"
                title="Đăng xuất"
              >
                <LogOut size={16} />
                <span className="text-xs font-black">Đăng xuất</span>
              </button>
            </div>

            {/* User avatar button (keeps existing menu) */}
            <button
              type="button"
              onClick={() => setShowUserMenu((v) => !v)}
              className="w-8 h-8 bg-linear-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg shadow-teal-200/50 transform transition-transform hover:scale-105 active:scale-95"
              aria-label="User menu"
            >
              {String(user?.displayName || "U")[0]?.toUpperCase()}
            </button>
          </div>
        </header>

        {showUserMenu && (
          <div className="relative">
            <div className="absolute right-0 top-0 z-60">
              <UserMenuPopup
                user={user}
                onClose={() => setShowUserMenu(false)}
                onLogout={onLogout}
                onEditProfile={() => {
                  setShowUserMenu(false);
                  setShowEditModal(true);
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Overview (image #2 content) */}
          <div className="h-full overflow-y-auto space-y-10 relative pb-10 pr-2 scrollbar-hide">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-[40px] bg-linear-to-br from-slate-900 to-slate-800 p-10 text-white shadow-2xl shadow-slate-900/20"
            >
              <div className="relative z-10 max-w-2xl">
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-1.5 bg-teal-500/20 backdrop-blur-md text-teal-400 text-xs font-bold uppercase tracking-widest rounded-full mb-6"
                >
                  Welcome back, {user?.displayName || "to the gathering"}
                </motion.span>
                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                  Your digital space for{" "}
                  <span className="text-teal-400">meaningful</span> connection.
                </h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-xl">
                  Explore resources, join conversations, and jump back into your
                  workspace from your personal command center.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => goTo("resources")}
                    className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    Browse Library
                  </button>
                  <button
                    onClick={() => goTo("forum")}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl border border-white/10 transition-all cursor-pointer"
                  >
                    Join Forum
                  </button>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none bg-linear-to-l from-teal-500/30 to-transparent" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px]" />
            </motion.div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Digital Library",
                  desc: "Explore a curated collection of knowledge, skill-building guides and expert resources.",
                  icon: Book,
                  view: "resources" as const,
                  color: "teal" as const,
                  count: "45+ Resources",
                },
                {
                  title: "Community Forum",
                  desc: "Share your thoughts, ask questions and collaborate with like-minded members.",
                  icon: MessageCircle,
                  view: "forum" as const,
                  color: "indigo" as const,
                  count: "128 Active Threads",
                },
                {
                  title: "Events Booking",
                  desc: "Don't miss out! Secure your spot in the most exciting upcoming live gatherings.",
                  icon: Calendar,
                  view: "events" as const,
                  color: "rose" as const,
                  count: "8 Upcoming",
                },
              ].map((item, idx) => (
                <motion.button
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                  onClick={() => goTo(item.view)}
                  className="group relative bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all text-left overflow-hidden cursor-pointer flex flex-col h-full"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:rotate-3 ${
                      item.color === "teal"
                        ? "bg-teal-50 text-teal-600 shadow-lg shadow-teal-100/50"
                        : item.color === "indigo"
                          ? "bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100/50"
                          : "bg-rose-50 text-rose-600 shadow-lg shadow-rose-100/50"
                    }`}
                  >
                    <item.icon size={26} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 mb-6 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {item.count}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:translate-x-1">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                  <div
                    className={`absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-1 pointer-events-none rounded-full ${
                      item.color === "teal"
                        ? "bg-teal-400/10"
                        : item.color === "indigo"
                          ? "bg-indigo-400/10"
                          : "bg-rose-400/10"
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            {/* Join workspace CTA */}
            <div className="flex flex-col items-center justify-center py-10 px-6 bg-linear-to-br from-indigo-50 to-teal-50 rounded-[40px] border border-white shadow-inner">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-lg bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="w-20 h-20 bg-white rounded-[24px] shadow-lg flex items-center justify-center text-teal-600 mb-8 mx-auto border border-teal-50">
                  <Video size={40} className="animate-pulse" />
                </div>
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-gray-900">
                    Enter Workspace
                  </h2>
                  <p className="text-gray-500 mt-3 text-lg">
                    Jump straight into your{" "}
                    <span className="text-teal-600 font-bold">space</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onEnterGame}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 group transition-all transform hover:translate-y-[-2px] active:scale-95 cursor-pointer text-lg"
                >
                  Connect to Gathering
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL EDIT PROFILE */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
          onEditAvatar={onEditAvatarRequest}
        />
      )}
    </div>
  );
};