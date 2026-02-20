/**
 * Full modal for room management: tabs Members | Settings | Invite.
 * Max-width 900px, two-column layout on Members tab.
 */
import { useState } from "react";
import { Users, Settings, Link2, UserX, Shield } from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import { InviteModal } from "../../components/modals";

type TabId = "members" | "settings" | "invite";

interface RoomManagementModalProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export default function RoomManagementModal({
  roomId,
  roomName,
  onClose,
}: RoomManagementModalProps) {
  const { users, currentUser, socket } = useSocket();
  const [tab, setTab] = useState<TabId>("members");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentUserId = (currentUser as any)?.userId;
  const isRoomAdmin = (currentUser as any)?.role === "admin";
  const members = users; // users from socket = room members with role/status

  const handleKick = (targetUserId: string) => {
    if (!isRoomAdmin || !socket) return;
    if (targetUserId === currentUserId) return;
    const target = members.find((u) => u.userId === targetUserId);
    if ((target as any)?.role === "admin") return;
    if (!window.confirm(`Xác nhận đưa "${(target as any)?.username || targetUserId}" ra khỏi phòng?`)) return;
    socket.emit("admin-kick-user", { targetUserId });
  };

  const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
    { id: "members", label: "Thành viên", icon: Users },
    { id: "settings", label: "Cài đặt", icon: Settings },
    { id: "invite", label: "Mời", icon: Link2 },
  ];

  return (
    <>
      <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý phòng</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {roomName} · {roomId}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-slate-400"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex border-b border-slate-200 dark:border-gray-700 px-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-gather-accent text-gather-accent dark:text-teal-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {tab === "members" && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Thông tin phòng
                    </h3>
                    <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 bg-slate-50/50 dark:bg-gray-800/50">
                      <p className="font-medium text-slate-900 dark:text-white">{roomName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{roomId}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                        {members.length} thành viên
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Danh sách thành viên
                    </h3>
                    <ul className="rounded-xl border border-slate-200 dark:border-gray-700 divide-y divide-slate-200 dark:divide-gray-700 overflow-hidden">
                      {members.length === 0 ? (
                        <li className="px-4 py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                          Chưa có thành viên nào.
                        </li>
                      ) : (
                        members.map((u) => {
                          const isSelf = u.userId === currentUserId;
                          const isTargetAdmin = (u as any).role === "admin";
                          const canKick = isRoomAdmin && !isSelf && !isTargetAdmin;
                          return (
                            <li
                              key={u.userId}
                              className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-gather-accent/20 text-gather-accent flex items-center justify-center text-sm font-bold shrink-0">
                                  {(u as any).username?.charAt(0) || "?"}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-medium text-slate-900 dark:text-white truncate block">
                                    {(u as any).username || u.userId}
                                    {isSelf && (
                                      <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(bạn)</span>
                                    )}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    {(u as any).status === "online" ? (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                    )}
                                    {(u as any).status === "online" ? "Đang online" : "Offline"}
                                    {(u as any).role === "admin" && (
                                      <>
                                        <span>·</span>
                                        <Shield size={12} className="inline text-amber-500" />
                                        Admin
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                              {canKick && (
                                <button
                                  type="button"
                                  onClick={() => handleKick(u.userId)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                                  title="Đưa ra khỏi phòng"
                                >
                                  <UserX size={16} />
                                  Đưa ra
                                </button>
                              )}
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="p-6 max-w-md">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Cài đặt phòng
                </h3>
                <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tên phòng</label>
                    <p className="text-slate-900 dark:text-white font-medium">{roomName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Mã phòng</label>
                    <p className="text-slate-700 dark:text-slate-300 font-mono text-sm">{roomId}</p>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Chỉnh sửa tên / mã phòng có thể thực hiện từ trang Quản lý phòng (Dashboard) hoặc API.
                  </p>
                </div>
              </div>
            )}

            {tab === "invite" && (
              <div className="p-6 max-w-md">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Mời thành viên
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                  Gửi link mời để bạn bè hoặc đồng nghiệp tham gia phòng này.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gather-accent hover:bg-gather-accent-hover text-white font-semibold transition"
                >
                  <Link2 size={18} />
                  Tạo link mời
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomId={roomId}
        />
      )}
    </>
  );
}
