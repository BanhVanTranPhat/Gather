import { useState, useEffect } from "react";
import { getServerUrl } from "../../config/env";
import { authFetch } from "../../utils/authFetch";

export interface RoomItem {
  roomId: string;
  name: string;
  isPrivate?: boolean;
  maxUsers?: number;
}

interface RoomListSidebarProps {
  currentRoomId: string;
  currentRoomName: string;
  onSwitchRoom: (roomId: string, roomName: string) => void;
  className?: string;
}

export default function RoomListSidebar({
  currentRoomId,
  currentRoomName,
  onSwitchRoom,
  className = "",
}: RoomListSidebarProps) {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const serverUrl = getServerUrl();

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${serverUrl}/api/spaces?mine=1`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setRooms(data.rooms || []);
      } catch {
        if (!cancelled) setRooms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [serverUrl]);

  const displayName = currentRoomName || currentRoomId;

  return (
    <div
      className={`w-[220px] shrink-0 flex flex-col bg-[#1E1F22] border-r border-white/10 overflow-hidden ${className}`}
    >
      <div className="p-3 border-b border-white/10">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Phòng
        </div>
        <div className="px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white font-semibold text-sm truncate">
          {displayName}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
          Chuyển phòng
        </div>
        {loading ? (
          <div className="px-3 py-2 text-slate-500 text-xs">Đang tải...</div>
        ) : rooms.length === 0 ? (
          <div className="px-3 py-2 text-slate-500 text-xs">Chưa có phòng</div>
        ) : (
          <ul className="space-y-0.5">
            {rooms.map((room) => {
              const isActive = room.roomId === currentRoomId;
              return (
                <li key={room.roomId}>
                  <button
                    type="button"
                    onClick={() => onSwitchRoom(room.roomId, room.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg mx-2 text-sm transition-colors ${
                      isActive
                        ? "bg-gather-accent/20 text-gather-accent font-medium"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="truncate block">{room.name || room.roomId}</span>
                    <span className="text-[10px] text-slate-500 truncate block">{room.roomId}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
