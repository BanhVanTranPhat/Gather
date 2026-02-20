import { useEffect, useState } from "react";
import { getServerUrl } from "../../config/env";
import { authFetch } from "../../utils/authFetch";

export interface ServerRoom {
  roomId: string;
  name: string;
  description?: string;
  maxUsers?: number;
  isPrivate?: boolean;
  createdBy?: string | null;
}

export interface RoomSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Gọi khi user chọn phòng (hoặc tạo mới) và bấm Vào phòng / Tạo và vào. Parent set roomId/roomName rồi mở SetupModal. */
  onChooseRoom: (roomId: string, roomName: string) => void;
  /** Mở với tab "tạo mới" được chọn (khi user bấm "Tạo phòng mới" từ dashboard). */
  defaultMode?: "select" | "create";
}

export default function RoomSelectModal({
  isOpen,
  onClose,
  onChooseRoom,
  defaultMode = "select",
}: RoomSelectModalProps) {
  const [rooms, setRooms] = useState<ServerRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"select" | "create">(defaultMode);
  const [newRoom, setNewRoom] = useState({ roomId: "", name: "", isPrivate: false, maxUsers: 20 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const serverUrl = getServerUrl();

  const refreshRooms = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await authFetch(`${serverUrl}/api/spaces?mine=1`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setRooms(data.rooms || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      refreshRooms();
      setEditingId(null);
      setNewRoom({ roomId: "", name: "", isPrivate: false, maxUsers: 20 });
    }
  }, [isOpen, defaultMode]);

  const handleJoinRoom = (room: ServerRoom) => {
    onChooseRoom(room.roomId, room.name);
    onClose();
  };

  const handleCreateAndJoin = async () => {
    if (!newRoom.name.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setCreating(true);
    try {
      const res = await authFetch(`${serverUrl}/api/spaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: newRoom.roomId.trim() || undefined,
          name: newRoom.name.trim(),
          isPrivate: newRoom.isPrivate,
          maxUsers: newRoom.maxUsers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Không thể tạo phòng");
      const room = data.room as ServerRoom;
      onChooseRoom(room.roomId, room.name);
      setNewRoom({ roomId: "", name: "", isPrivate: false, maxUsers: 20 });
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (room: ServerRoom) => {
    setEditingId(room.roomId);
    setEditName(room.name);
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setSaveError(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSaveError(null);
    setSavingEdit(true);
    try {
      const url = `${serverUrl}/api/spaces/${encodeURIComponent(editingId)}`;
      const res = await authFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(data?.message || "Không thể cập nhật");
      }
      const newName = (data?.room as ServerRoom)?.name ?? editName.trim();
      setRooms((prev) =>
        prev.map((r) => (r.roomId === editingId ? { ...r, name: newName } : r))
      );
      cancelEdit();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gather-hero border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Chọn phòng hoặc tạo mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setMode("select")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "select"
                ? "text-gather-accent border-b-2 border-gather-accent bg-white/5"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Phòng của tôi
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "create"
                ? "text-gather-accent border-b-2 border-gather-accent bg-white/5"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tạo phòng mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mode === "select" && (
            <>
              <p className="text-slate-400 text-sm mb-3">
                Chọn phòng để vào hoặc bấm "Sửa" để đổi tên hiển thị / tên phòng.
              </p>
              {loading ? (
                <div className="text-slate-400 py-6 text-center">Đang tải...</div>
              ) : rooms.length === 0 ? (
                <div className="text-slate-400 py-6 text-center">
                  Chưa có phòng. Chuyển sang tab &quot;Tạo phòng mới&quot; để tạo.
                </div>
              ) : (
                <ul className="space-y-2">
                  {rooms.map((room) => (
                    <li
                      key={room.roomId}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col gap-2"
                    >
                      {editingId === room.roomId ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-slate-400 uppercase tracking-wider">
                            Tên hiển thị
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Tên hiển thị"
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-gather-accent/50"
                          />
                          <div className="text-xs text-slate-500">
                            Mã phòng: <code className="bg-white/10 px-1 rounded">{room.roomId}</code>
                          </div>
                          {saveError && (
                            <p className="text-red-400 text-sm">{saveError}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={savingEdit || !editName.trim()}
                              className="px-3 py-1.5 rounded-lg bg-gather-accent text-slate-900 font-medium text-sm disabled:opacity-50"
                            >
                              {savingEdit ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingEdit}
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-sm disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">{room.name}</div>
                              <div className="text-xs text-slate-500 truncate">
                                {room.roomId} · {room.isPrivate ? "Riêng tư" : "Công khai"}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEdit(room)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                                title="Đổi tên hiển thị"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleJoinRoom(room)}
                                className="px-3 py-1.5 rounded-lg bg-gather-accent text-slate-900 font-medium text-sm hover:opacity-90"
                              >
                                Vào phòng
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {mode === "create" && (
            <>
              <p className="text-slate-400 text-sm mb-3">
                Đặt tên hiển thị và (tùy chọn) mã phòng. Mã phòng để trống sẽ tự sinh.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Tên hiển thị phòng
                  </label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                    placeholder="vd: Team Daily, Phòng họp A"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-gather-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Mã phòng (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={newRoom.roomId}
                    onChange={(e) => setNewRoom((p) => ({ ...p, roomId: e.target.value }))}
                    placeholder="Để trống sẽ tự sinh"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-gather-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Sức chứa (call video)
                  </label>
                  <select
                    value={newRoom.maxUsers}
                    onChange={(e) => setNewRoom((p) => ({ ...p, maxUsers: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white focus:outline-none focus:border-gather-accent/50"
                  >
                    <option value={20}>20 người (mặc định)</option>
                    <option value={50}>50 người (Premium)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={newRoom.isPrivate}
                    onChange={(e) => setNewRoom((p) => ({ ...p, isPrivate: e.target.checked }))}
                    className="rounded border-white/20"
                  />
                  Phòng riêng tư
                </label>
                <button
                  type="button"
                  onClick={handleCreateAndJoin}
                  disabled={creating || !newRoom.name.trim()}
                  className="px-5 py-3 rounded-xl bg-gather-accent text-slate-900 font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Đang tạo..." : "Tạo và vào phòng"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
