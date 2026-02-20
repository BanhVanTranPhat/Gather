import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getServerUrl } from "../../config/env";
import { authFetch } from "../../utils/authFetch";
import { useToast } from "../../contexts/ToastContext";

interface SavedRoom {
  id: string;
  name: string;
  lastJoined: number;
}

interface ServerRoom {
  roomId: string;
  name: string;
  description?: string;
  maxUsers?: number;
  isPrivate?: boolean;
  createdBy?: string | null;
}

export default function SpacesManager() {
  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const [serverRooms, setServerRooms] = useState<ServerRoom[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomId: "",
    name: "",
    isPrivate: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const navigate = useNavigate();
  const serverUrl = getServerUrl();
  const { showToast } = useToast();

  const refreshServerRooms = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingServer(true);
    try {
      const res = await authFetch(`${serverUrl}/api/spaces?mine=1`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setServerRooms(data.rooms || []);
    } finally {
      setLoadingServer(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    const stored = localStorage.getItem("savedRooms");
    if (stored) {
      try {
        setRooms(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    refreshServerRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, serverUrl]);

  const handleJoinServerRoom = (room: ServerRoom) => {
    localStorage.setItem("roomId", room.roomId);
    localStorage.setItem("roomName", room.name);
    navigate("/app");
  };

  const handleJoinRoom = (room: SavedRoom) => {
    localStorage.setItem("roomId", room.id);
    localStorage.setItem("roomName", room.name);
    navigate("/app");
  };

  const handleCreateServerRoom = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!newRoom.name.trim()) {
      showToast("Vui lòng nhập tên phòng", { variant: "warning" });
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch(`${serverUrl}/api/spaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: newRoom.roomId.trim() || undefined,
          name: newRoom.name.trim(),
          isPrivate: newRoom.isPrivate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không thể tạo phòng");
      setNewRoom({ roomId: "", name: "", isPrivate: false });
      await refreshServerRooms();
    } catch (e) {
      showToast((e as Error).message, { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteServerRoom = async (roomId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!confirm(`Xóa phòng "${roomId}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await authFetch(`${serverUrl}/api/spaces/${encodeURIComponent(roomId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không thể xóa phòng");
      setRooms((prev) => {
        const next = prev.filter((r) => r.id !== roomId);
        localStorage.setItem("savedRooms", JSON.stringify(next));
        return next;
      });
      await refreshServerRooms();
      showToast("Đã xóa phòng", { variant: "success" });
    } catch (e) {
      showToast((e as Error).message, { variant: "error" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div>
          <h2 className="m-0 text-2xl font-extrabold text-white">
            Quản lý phòng
          </h2>
          <p className="m-0 mt-2 text-slate-400 text-sm">
            Tạo / xóa phòng và vào nhanh.
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-semibold cursor-pointer hover:bg-white/10 transition-colors"
          onClick={refreshServerRooms}
          disabled={loadingServer}
        >
          {loadingServer ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quick Create: 1 input + nút nổi bật; nâng cao trong collapsible */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="m-0 text-lg font-bold text-white">Tạo phòng nhanh</h3>
          <p className="m-0 mt-1 text-xs text-slate-400">
            Nhập tên phòng, mã phòng sẽ tự sinh nếu không chỉ định.
          </p>
          <div className="mt-4 flex gap-3">
            <input
              value={newRoom.name}
              onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
              placeholder="Tên phòng"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-slate-100 placeholder:text-slate-600 focus:border-gather-accent/50 outline-none"
            />
            <button
              className="px-5 py-3 rounded-xl border-none bg-gather-accent text-white font-bold cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              onClick={handleCreateServerRoom}
              disabled={creating}
            >
              {creating ? "Đang tạo..." : "Tạo phòng"}
            </button>
          </div>
          <button
            type="button"
            className="mt-3 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "Ẩn cài đặt nâng cao" : "Cài đặt nâng cao"}
          </button>
          {showAdvanced && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-3">
              <input
                value={newRoom.roomId}
                onChange={(e) => setNewRoom((p) => ({ ...p, roomId: e.target.value }))}
                placeholder="Mã phòng (tùy chọn)"
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-slate-100 placeholder:text-slate-600 focus:border-gather-accent/50 outline-none text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={newRoom.isPrivate}
                  onChange={(e) =>
                    setNewRoom((p) => ({ ...p, isPrivate: e.target.checked }))
                  }
                />
                Private
              </label>
            </div>
          )}
        </div>

        {/* Server rooms */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="m-0 text-lg font-bold text-white">Phòng trên server</h3>
          <p className="m-0 mt-1 text-xs text-slate-400">
            Danh sách đồng bộ theo tài khoản.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingServer ? (
              <div className="p-4 rounded-xl border border-white/10 text-slate-400">
                Đang tải...
              </div>
            ) : serverRooms.length === 0 ? (
              <div className="p-4 rounded-xl border border-white/10 text-slate-400">
                Chưa có phòng nào (hoặc bạn chưa tham gia/tạo phòng).
              </div>
            ) : (
              serverRooms.map((r) => (
                <div
                  key={r.roomId}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl bg-gather-accent flex items-center justify-center text-white text-base font-bold">
                      {r.name?.charAt(0) || "R"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {r.roomId} • {r.isPrivate ? "Private" : "Public"} • max{" "}
                        {r.maxUsers || 20}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <button
                      className="border-none bg-emerald-600 text-white px-3 py-2 rounded-lg cursor-pointer font-semibold transition-opacity hover:opacity-85"
                      onClick={() => handleJoinServerRoom(r)}
                    >
                      Vào phòng
                    </button>
                    <button
                      className="border border-red-500/30 bg-red-500/10 text-red-300 px-3 py-2 rounded-lg cursor-pointer font-semibold hover:bg-red-500/20 transition-colors"
                      onClick={() => handleDeleteServerRoom(r.roomId)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="m-0 text-lg font-bold text-white">Gần đây</h3>
        <p className="m-0 mt-1 text-xs text-slate-400">
          Danh sách lưu trên máy.
        </p>
        {rooms.length === 0 ? (
          <div className="mt-4 p-4 rounded-xl border border-white/10 text-slate-400">
            Chưa có phòng nào gần đây.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <button
                key={room.id}
                className="text-left rounded-xl border border-white/10 bg-black/20 p-4 cursor-pointer hover:bg-black/30 transition-colors"
                onClick={() => handleJoinRoom(room)}
              >
                <div className="text-sm font-bold text-white">{room.name}</div>
                <div className="text-xs text-slate-400">{room.id}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Lần cuối: {new Date(room.lastJoined).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

