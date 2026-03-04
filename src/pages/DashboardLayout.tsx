import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { LogOut, UserRoundPen } from "lucide-react";
import {
  UserMenuPopup,
  EditProfileModal,
} from "../features/profile/ProfileModals";
import { getServerUrl } from "../config/env";
import { authFetch } from "../utils/authFetch";
import {
  SetupModal,
  RoomSelectModal,
  AvatarPickerModal,
} from "../components/modals";
import { UserAvatarDisplay } from "../components/UserAvatarDisplay";

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const serverUrl = getServerUrl();

  const onLogout = () => {
    logout();
    navigate("/", { replace: true });
  };
  const onEditAvatarRequest = () => navigate("/auth/avatar");
  const [user, setUser] = useState<{
    displayName?: string;
    profileColor?: string;
    avatar?: string;
    role?: string;
    avatarConfig?: Record<string, unknown>;
  }>({
    displayName: "Loading...",
    profileColor: "#87CEEB",
    avatarConfig: {},
  });

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showRoomSelectModal, setShowRoomSelectModal] = useState(false);
  const [roomSelectDefaultMode, setRoomSelectDefaultMode] = useState<
    "select" | "create"
  >("select");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const hasUsedRoom = useMemo(() => {
    const roomId = localStorage.getItem("roomId");
    if (roomId) return true;
    try {
      const saved = localStorage.getItem("savedRooms");
      if (saved && JSON.parse(saved).length > 0) return true;
    } catch {
      // Ignore invalid JSON in savedRooms
    }
    return false;
  }, []);

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
        setUser((prev) => ({ ...prev, ...parsed }));
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
            setUser((prev) => ({ ...prev, ...data }));
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
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [now],
  );

  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now),
    [now],
  );

  const handleJoinByCode = () => {
    const raw = joinCode.trim();
    if (!raw) return;

    let roomId = raw;
    try {
      const maybeUrl = new URL(raw);
      const fromQuery = maybeUrl.searchParams.get("roomId");
      if (fromQuery) {
        roomId = fromQuery;
      }
    } catch {
      // not a URL, treat as plain roomId
    }

    localStorage.setItem("roomId", roomId);
    localStorage.setItem("roomName", "Phòng bằng mã");
    setShowSetupModal(true);
  };

  return (
    <div className="h-screen bg-gather-page flex overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main content – centered like Google Meet */}
      <main className="flex-1 p-6 flex flex-col h-full min-h-0 overflow-hidden z-10 transition-all duration-300">
        {/* Top header pill */}
        <header className="flex justify-between items-center py-4 px-6 mb-4 bg-white/60 backdrop-blur-xl rounded-full border border-white/50 shadow-sm sticky top-0 z-50">
          <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
              Welcome, {user?.displayName || "there"}!
            </h1>
            <p className="text-[11px] text-gray-500 font-bold mt-1.5 uppercase tracking-wider">
              {timeLabel} · {dateLabel}
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
                size="md"
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
                onAdminClick={isAdmin ? () => navigate("/admin") : undefined}
                onOpenAvatarPicker={() => {
                  setShowUserMenu(false);
                  setShowAvatarPicker(true);
                }}
                onPickAvatarColor={async (color) => {
                  const previousColor = user?.profileColor;
                  setUser((prev) => ({ ...prev, profileColor: color }));
                  try {
                    await authFetch(`${serverUrl}/api/user/profile`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ profileColor: color }),
                    });
                  } catch {
                    setUser((prev) => ({
                      ...prev,
                      profileColor: previousColor,
                    }));
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Overview: hero giống Google Meet + vài gợi ý nhẹ */}
          <div className="h-full overflow-y-auto space-y-16 relative pb-12 pr-2 scrollbar-hide">
            {/* Primary Action: 1 hành động chính — user mới thấy onboarding, user cũ thấy hero + CTA */}
            {!hasUsedRoom ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-linear-to-br from-gather-hero to-gather-hero-end p-8 md:p-10 text-white"
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
                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={() => openRoomSelectModal("create")}
                      className="px-6 py-3.5 bg-gather-accent hover:bg-gather-accent-hover text-slate-900 font-bold rounded-xl transition-all duration-200 btn-scale cursor-pointer shadow-md"
                    >
                      Cuộc họp mới
                    </button>
                    <div className="flex flex-wrap gap-2 items-center bg-white/10 rounded-xl px-3 py-2">
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Nhập mã hoặc đường link"
                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-300 min-w-[180px]"
                      />
                      <button
                        type="button"
                        onClick={handleJoinByCode}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold"
                      >
                        Tham gia
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-15 pointer-events-none bg-linear-to-l from-teal-500/40 to-transparent" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gather-hero to-gather-hero-end p-5 md:p-6 text-white"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
              >
                <div className="relative z-10 flex flex-col gap-4">
                  <div>
                    <h2
                      className="text-xl md:text-2xl font-bold leading-tight tracking-tight"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      Tính năng họp và gọi video cho lớp học của bạn
                    </h2>
                    <p className="text-slate-300 text-sm mt-0.5">
                      Kết nối, cộng tác và thảo luận trong không gian Gather.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={() => openRoomSelectModal("create")}
                      className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-sm transition-all duration-200 btn-scale cursor-pointer shadow-sm"
                    >
                      Cuộc họp mới
                    </button>
                    <div className="flex flex-wrap gap-2 items-center bg-white/10 rounded-xl px-3 py-2">
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Nhập mã hoặc đường link"
                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-300 min-w-[200px]"
                      />
                      <button
                        type="button"
                        onClick={handleJoinByCode}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold"
                      >
                        Tham gia
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none bg-linear-to-l from-teal-500/50 to-transparent" />
              </motion.div>
            )}

            {/* Gợi ý nhanh và cài đặt */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-4 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Hướng dẫn nhanh
                </p>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li>1. Bấm <strong>Cuộc họp mới</strong> để tạo phòng.</li>
                  <li>2. Gửi link phòng cho bạn bè / giảng viên.</li>
                  <li>3. Vào phòng và dùng chat, forum, thư viện trong không gian.</li>
                </ol>
              </div>
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-4 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Kiểm tra thiết bị
                </p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Kiểm tra micro và loa trong bước chuẩn bị trước khi vào phòng.</li>
                  <li>• Đề xuất dùng Chrome hoặc Edge mới nhất để ổn định WebRTC.</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-4 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tuỳ chỉnh & cài đặt
                </p>
                <p className="text-sm text-slate-700 mb-3">
                  Đổi theme, ngôn ngữ, thông báo và một số tuỳ chọn khác trong trang cài đặt.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors btn-scale cursor-pointer"
                >
                  Mở cài đặt
                </button>
              </div>
            </section>
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
          setUser((prev) => ({ ...prev, avatar }));
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
            } catch {
              // Ignore localStorage JSON errors
            }
          } catch {
            setUser((prev) => ({ ...prev, avatar: user?.avatar }));
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
        userName={user?.displayName || ""}
        onJoin={handleSetupJoin}
      />
    </div>
  );
};
