import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  ArrowRight,
  Book,
  Calendar,
  Layout,
  LayoutGrid,
  MessageCircle,
  LogOut,
  Settings,
  UserRoundPen,
  Video,
} from "lucide-react";
import {
  UserMenuPopup,
  EditProfileModal,
} from "../features/profile/ProfileModals";
import { getServerUrl } from "../config/env";
import { authFetch } from "../utils/authFetch";
import { EventProvider } from "../contexts";
import { SetupModal, RoomSelectModal, AvatarPickerModal } from "../components/modals";
import { UserAvatarDisplay } from "../components/UserAvatarDisplay";
import Library from "./Library";
import EventsPage from "./EventsPage";
import { ForumPage } from "../features/forum";
import SpacesManager from "../components/chat/SpacesManager";

interface Props {
  onLogout: () => void;
  onEditAvatarRequest: () => void;
  onSettingsRequest: () => void;
  onEnterGame: () => void;
}

type DashboardView =
  | "overview"
  | "forum"
  | "resources"
  | "events"
  | "lobby"
  | "spaces";
type DashboardNavView = DashboardView | "admin";

export const DashboardLayout = ({
  onLogout,
  onEditAvatarRequest,
  onSettingsRequest,
  onEnterGame,
}: Props) => {
  const navigate = useNavigate();
  const serverUrl = getServerUrl();
  const [user, setUser] = useState<any>({
    displayName: "Loading...",
    profileColor: "#87CEEB",
    avatarConfig: {},
  });

  const [activeView, setActiveView] = useState<DashboardNavView>("overview");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showRoomSelectModal, setShowRoomSelectModal] = useState(false);
  const [roomSelectDefaultMode, setRoomSelectDefaultMode] = useState<"select" | "create">("select");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const hasUsedRoom = useMemo(() => {
    const roomId = localStorage.getItem("roomId");
    if (roomId) return true;
    try {
      const saved = localStorage.getItem("savedRooms");
      if (saved && JSON.parse(saved).length > 0) return true;
    } catch {}
    return false;
  }, [activeView]);

  const ensureRoom = () => {
    if (!localStorage.getItem("roomId")) {
      localStorage.setItem(
        "roomId",
        `space-${Math.random().toString(36).slice(2, 8)}`,
      );
      localStorage.setItem("roomName", "Phòng nhanh");
    }
  };

  const openSetupModal = () => {
    ensureRoom();
    setShowSetupModal(true);
  };

  /** Mở popup chọn phòng (hoặc tạo mới), sau khi chọn sẽ mở SetupModal (camera/micro) rồi vào app. */
  const openRoomSelectModal = (mode: "select" | "create") => {
    setRoomSelectDefaultMode(mode);
    setShowRoomSelectModal(true);
  };

  const handleChooseRoom = (roomId: string, roomName: string) => {
    localStorage.setItem("roomId", roomId);
    localStorage.setItem("roomName", roomName);
    setShowRoomSelectModal(false);
    setShowSetupModal(true);
  };

  const handleSetupJoin = () => {
    setShowSetupModal(false);
    navigate("/app");
  };

  useEffect(() => {
    // Load user từ localStorage trước để hiển thị ngay
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser((prev: any) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn("Failed to parse stored user:", e);
      }
    }

    // Sau đó fetch từ API để cập nhật
    const token = localStorage.getItem("token");
    if (token) {
      authFetch(`${serverUrl}/api/user/me`)
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          if (data) {
            setUser((prev: any) => ({ ...prev, ...data }));
            // Lưu lại vào localStorage để giữ trạng thái
            localStorage.setItem("user", JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
  }, [serverUrl]);

  const handleSaveProfile = (newName: string, newColor: string) => {
    setUser({ ...user, displayName: newName, profileColor: newColor });
    setShowEditModal(false);
  };

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const navItems = useMemo(
    () => [
      { id: "overview" as const, icon: Layout, label: "Trang chủ" },
      { id: "resources" as const, icon: Book, label: "Thư viện" },
      { id: "events" as const, icon: Calendar, label: "Sự kiện" },
      { id: "forum" as const, icon: MessageCircle, label: "Diễn đàn" },
      { id: "lobby" as const, icon: Video, label: "Vào phòng" },
      { id: "spaces" as const, icon: LayoutGrid, label: "Quản lý phòng" },
    ],
    []
  );

  const goTo = (view: DashboardNavView) => {
    if (view === "lobby") {
      openSetupModal();
      setActiveView("overview");
      return;
    }
    setActiveView(view);
    // Admin có trang riêng /admin, không nằm trong nav chính
  };

  const headerInfo = useMemo(() => {
    switch (activeView) {
      case "overview":
        return {
          title: `Welcome, ${user?.displayName || "there"}!`,
          desc: "Here's what's happening in The Gathering today.",
        };
      case "forum":
        return { title: "Diễn đàn", desc: "Thảo luận theo chủ đề." };
      case "resources":
        return {
          title: "Thư viện",
          desc: "Khám phá tài liệu, sách và khóa học.",
        };
      case "events":
        return { title: "Sự kiện", desc: "Booking & reminders." };
      case "lobby":
        return {
          title: "Vào phòng",
          desc: "Chuẩn bị trước khi vào không gian.",
        };
      case "spaces":
        return {
          title: "Quản lý phòng",
          desc: "Tạo / xóa phòng và vào nhanh.",
        };
      default:
        return { title: "Dashboard", desc: "" };
    }
  }, [activeView, user?.displayName]);

  return (
    <div className="h-screen bg-gather-page flex overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar: expand on hover để hiện rõ chức năng (Discord/Notion style) */}
      <aside
        className={`h-screen flex-none bg-white/60 backdrop-blur-xl border-r border-white/40 hidden md:flex flex-col sticky top-0 py-6 z-20 transition-all duration-200 overflow-hidden ${
          sidebarExpanded ? "w-44" : "w-16"
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div
          className={`mb-8 flex items-center ${sidebarExpanded ? "px-4 gap-3" : "justify-center px-0"}`}
        >
          <div className="bg-gather-accent w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-md select-none shrink-0">
            TG
          </div>
          {sidebarExpanded && (
            <span className="text-sm font-bold text-gray-800 truncate">
              Gathering
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 w-full px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              title={item.label}
              className={`flex items-center w-full rounded-xl cursor-pointer relative group transition-all duration-200 ease-out py-3 ${
                sidebarExpanded ? "px-3 gap-3" : "justify-center px-0"
              } ${
                activeView === item.id
                  ? "bg-[rgba(34,197,94,0.12)] text-gather-accent"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarExpanded && (
                <span className="text-sm font-semibold truncate text-left">
                  {item.label}
                </span>
              )}
              {!sidebarExpanded && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                  {item.label}
                  <div className="absolute top-1/2 left-[-4px] transform -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              )}
              {activeView === item.id && (
                <motion.div
                  layoutId="sidebar-indicator-gather"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-gather-accent rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-100 w-full px-2 space-y-0.5">
          <button
            onClick={onSettingsRequest}
            title="Settings"
            className={`flex items-center w-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl transition-all cursor-pointer py-3 ${
              sidebarExpanded ? "px-3 gap-3" : "justify-center px-0"
            }`}
          >
            <Settings size={20} className="shrink-0" />
            {sidebarExpanded && (
              <span className="text-sm font-semibold truncate">Cài đặt</span>
            )}
          </button>
          {isAdmin && (
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigate("/admin");
              }}
              title="Trang quản trị"
              className={`flex items-center w-full text-gray-400 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-all cursor-pointer py-3 ${
                sidebarExpanded ? "px-3 gap-3" : "justify-center px-0"
              }`}
            >
              <Shield size={20} className="shrink-0" />
              {sidebarExpanded && (
                <span className="text-sm font-semibold truncate">Trang quản trị</span>
              )}
            </a>
          )}
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
            <button
              type="button"
              onClick={() => setShowUserMenu((v) => !v)}
              className="text-right hidden sm:block px-2 cursor-pointer hover:opacity-80"
            >
              <p className="text-xs font-black text-gray-900 tracking-tight">
                {user?.displayName}
              </p>
              <p className="text-[9px] text-gather-accent font-bold uppercase tracking-widest">
                {user?.role || "user"}
              </p>
            </button>

            {/* Quick actions: đổi avatar nhân vật game + logout */}
            <div className="hidden lg:flex items-center gap-1 pr-1">
            <button
              type="button"
              onClick={onEditAvatarRequest}
              className="h-8 px-3 rounded-full bg-white/70 hover:bg-white text-slate-700 border border-white/60 shadow-sm transition-all active:scale-95 inline-flex items-center gap-2"
              title="Đổi avatar nhân vật trong phòng"
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

            {/* Avatar hồ sơ: bấm vào để đổi (mèo/chó/upload) */}
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="shrink-0 rounded-full overflow-hidden shadow-lg shadow-teal-200/50 transform transition-transform hover:scale-105 active:scale-95 ring-2 ring-white/20"
              aria-label="Đổi avatar hồ sơ"
              title="Bấm để đổi avatar (preset / ảnh)"
            >
              <UserAvatarDisplay
                avatar={user?.avatar}
                profileColor={user?.profileColor}
                displayName={user?.displayName}
                size="sm"
              />
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
                onOpenAvatarPicker={() => {
                  setShowUserMenu(false);
                  setShowAvatarPicker(true);
                }}
                onPickAvatarColor={async (color) => {
                  const previousColor = user?.profileColor;
                  setUser((prev: any) => ({ ...prev, profileColor: color }));
                  try {
                    await authFetch(`${serverUrl}/api/user/profile`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ profileColor: color }),
                    });
                  } catch {
                    setUser((prev: any) => ({ ...prev, profileColor: previousColor }));
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Overview (image #2 content) */}
          <div className="h-full overflow-y-auto space-y-16 relative pb-12 pr-2 scrollbar-hide">
            {/* Primary Action: 1 hành động chính — user mới thấy onboarding, user cũ thấy hero + CTA */}
            {!hasUsedRoom ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gather-hero to-gather-hero-end p-8 md:p-10 text-white"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
              >
                <div className="relative z-10 max-w-xl">
                  <h2
                    className="text-2xl md:text-3xl font-black mb-2 leading-tight tracking-tight"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    Chào mừng đến The Gathering 👋
                  </h2>
                  <p className="text-slate-300 text-base mb-6">
                    Bắt đầu trong 3 bước:
                  </p>
                  <ol className="space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-gather-accent/20 text-gather-accent flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      <span>Tạo phòng (hoặc dùng phòng nhanh)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-gather-accent/20 text-gather-accent flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      <span>Mời bạn bè qua link</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-gather-accent/20 text-gather-accent flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      <span>Bắt đầu tập trung / thảo luận</span>
                    </li>
                  </ol>
                  <button
                    onClick={() => openRoomSelectModal("create")}
                    className="px-6 py-3.5 bg-gather-accent hover:bg-gather-accent-hover text-slate-900 font-bold rounded-xl transition-all duration-200 btn-scale cursor-pointer shadow-md"
                  >
                    Tạo phòng & Vào ngay
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-15 pointer-events-none bg-linear-to-l from-teal-500/40 to-transparent" />
              </motion.div>
            ) : (
              <>
                {/* Hero giảm 50% – tool, không marketing */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gather-hero to-gather-hero-end p-5 md:p-6 text-white"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                >
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2
                        className="text-xl md:text-2xl font-bold leading-tight tracking-tight"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        Chào {user?.displayName || "bạn"}
                      </h2>
                      <p className="text-slate-400 text-sm mt-0.5">
                        Vào phòng làm việc hoặc tạo phòng mới.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openRoomSelectModal("select")}
                        className="px-5 py-2.5 bg-gather-accent hover:bg-gather-accent-hover text-slate-900 font-bold rounded-xl text-sm transition-all duration-200 btn-scale cursor-pointer"
                      >
                        Vào phòng ngay
                      </button>
                      <button
                        onClick={() => openRoomSelectModal("create")}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition-all duration-200 btn-scale cursor-pointer"
                      >
                        Tạo phòng mới
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none bg-linear-to-l from-teal-500/50 to-transparent" />
                </motion.div>
                {/* Dashboard thực tế: Start Session + Rooms online + Bạn bè */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Bắt đầu
                    </p>
                    <button
                      type="button"
                      onClick={openSetupModal}
                      className="text-left w-full font-bold text-slate-900 hover:text-gather-accent transition-colors"
                    >
                      Start Session →
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Phòng đang mở
                    </p>
                    <p className="text-lg font-black text-slate-800">—</p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Bạn bè đang online
                    </p>
                    <p className="text-lg font-black text-slate-800">—</p>
                  </div>
                </div>
              </>
            )}

            {/* Nội dung theo sidebar: border/shadow nhẹ, spacing thoáng */}
            {activeView !== "overview" && (
              <div className="min-h-[400px] rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-700/80 shadow-sm">
                {activeView === "resources" && (
                  <Library embedded onBack={() => setActiveView("overview")} />
                )}
                {activeView === "events" && (
                  <EventProvider>
                    <EventsPage
                      embedded
                      onBack={() => setActiveView("overview")}
                    />
                  </EventProvider>
                )}
                {activeView === "forum" && (
                  <ForumPage
                    embedded
                    onBack={() => setActiveView("overview")}
                  />
                )}
                {activeView === "spaces" && (
                  <div className="bg-gather-hero min-h-[400px]">
                    <SpacesManager />
                  </div>
                )}
              </div>
            )}

            {/* Trang chủ (Overview): Hero + Quick Access Grid + Enter Workspace */}
            {activeView === "overview" && (
              <>
                {!hasUsedRoom && (
                  <p className="text-sm text-slate-500 text-center py-2">
                    Sau khi vào phòng lần đầu, bạn sẽ thấy thêm:{" "}
                    <strong className="text-slate-600">Sự kiện</strong>,{" "}
                    <strong className="text-slate-600">Chat</strong>,{" "}
                    <strong className="text-slate-600">Quản lý phòng</strong>.
                  </p>
                )}
                {/* Quick Access Grid – spacing 24px, card hover elevate */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Digital Library",
                      desc: "Curated knowledge, guides and resources.",
                      icon: Book,
                      view: "resources" as const,
                      color: "teal" as const,
                      count: "45+ Resources",
                    },
                    {
                      title: "Community Forum",
                      desc: "Share ideas and collaborate with members.",
                      icon: MessageCircle,
                      view: "forum" as const,
                      color: "indigo" as const,
                      count: "128 Threads",
                    },
                    {
                      title: "Events Booking",
                      desc: "Book your spot in upcoming gatherings.",
                      icon: Calendar,
                      view: "events" as const,
                      color: "rose" as const,
                      count: "8 Upcoming",
                    },
                  ].map((item, idx) => (
                    <motion.button
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 + 0.2 }}
                      onClick={() => goTo(item.view)}
                      className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 text-left overflow-hidden cursor-pointer flex flex-col h-full card-hover"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-105 ${
                          item.color === "teal"
                            ? "bg-emerald-50 text-emerald-600"
                            : item.color === "indigo"
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        <item.icon size={22} />
                      </div>
                      <h3
                        className="text-lg font-bold text-gray-900 mb-2 tracking-tight"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
                        {item.desc}
                      </p>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.count}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-gather-accent group-hover:text-white transition-all duration-200">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Enter Workspace – nhẹ hơn, không lặp hero */}
                <div className="flex flex-col items-center justify-center py-8 px-6 bg-slate-50 dark:bg-gray-800/40 rounded-2xl border border-slate-200/60">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="w-full max-w-md bg-white dark:bg-gray-800/80 p-8 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden"
                  >
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-gather-accent mb-6">
                      <Video size={28} />
                    </div>
                    <h2
                      className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      Vào phòng
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      Vào phòng làm việc ngay.
                    </p>
                    <button
                      type="button"
                      onClick={openSetupModal}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 btn-scale cursor-pointer"
                    >
                      Vào phòng
                      <ArrowRight size={18} />
                    </button>
                  </motion.div>
                </div>
              </>
            )}
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

      <AvatarPickerModal
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatar={user?.avatar}
        profileColor={user?.profileColor}
        displayName={user?.displayName}
        onSelect={async (avatar) => {
          setUser((prev: any) => ({ ...prev, avatar }));
          setShowAvatarPicker(false);
          try {
            await authFetch(`${serverUrl}/api/user/profile`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatar }),
            });
            try {
              const u = JSON.parse(localStorage.getItem("user") || "{}");
              localStorage.setItem("user", JSON.stringify({ ...u, avatar }));
            } catch {}
          } catch {
            setUser((prev: any) => ({ ...prev, avatar: user?.avatar }));
          }
        }}
      />
      <RoomSelectModal
        isOpen={showRoomSelectModal}
        onClose={() => setShowRoomSelectModal(false)}
        onChooseRoom={handleChooseRoom}
        defaultMode={roomSelectDefaultMode}
      />
      <SetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        roomId={localStorage.getItem("roomId") || ""}
        roomName={localStorage.getItem("roomName") || "Phòng nhanh"}
        userName={user?.displayName || (user as any)?.username || ""}
        onJoin={handleSetupJoin}
      />
    </div>
  );
};
