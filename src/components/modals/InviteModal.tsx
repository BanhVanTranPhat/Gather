import { useState, useEffect } from "react";
import { getServerUrl } from "../../config/env";
import { useSocket } from "../../contexts/SocketContext";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

const InviteModal = ({ isOpen, onClose, roomId }: InviteModalProps) => {
  const { users, currentUser } = useSocket();
  const [inviteLink, setInviteLink] = useState("");
  const [maxUsers, setMaxUsers] = useState(20);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Số người trong phòng = tập userId duy nhất (tránh đếm 2 khi chỉ có 1 người)
  const currentUserCount = (() => {
    const ids = new Set<string>();
    if (currentUser?.userId) ids.add(currentUser.userId);
    users.forEach((u) => ids.add(u.userId));
    return ids.size;
  })();

  useEffect(() => {
    if (isOpen && roomId) {
      generateInviteLink();
    }
  }, [isOpen, roomId]);

  const generateInviteLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getServerUrl()}/api/rooms/${roomId}/invite`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.inviteLink);
        if (typeof data.maxUsers === "number") setMaxUsers(data.maxUsers);
      }
    } catch (error) {
      console.error("Failed to generate invite link", error);
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/app`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      const text = inviteLink;

      // Prefer async clipboard API when available (requires secure context)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts (http) / older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        textarea.style.left = "-1000px";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("execCommand(copy) failed");
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-1000 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border border-slate-800 rounded-2xl w-[92%] max-w-[520px] shadow-2xl animate-[modalSlideIn_0.2s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gather-accent/20 to-gather-accent/10 border border-gather-accent/20 flex items-center justify-center">
              <span className="text-gather-accent text-sm">↗</span>
            </div>
            <div>
              <h2 className="m-0 text-base font-semibold text-slate-100">
                Mời đồng nghiệp
              </h2>
              <p className="m-0 text-xs text-slate-400">
                Copy link để mời người khác vào phòng này
              </p>
            </div>
          </div>
          <button
            className="bg-transparent border-none text-slate-400 cursor-pointer p-2 leading-none transition-all rounded-xl hover:bg-slate-800 hover:text-slate-100"
            onClick={onClose}
            aria-label="Close"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-3 mb-5 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Phòng:</span>
              <span className="text-sm text-slate-100 font-semibold">{roomId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Số người:</span>
              <span className="text-sm text-slate-100 font-semibold">
                {currentUserCount} / {maxUsers}
              </span>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-100 mb-2">
              Link mời
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={loading ? "Đang tạo link..." : inviteLink}
                readOnly
                className="flex-1 px-3 py-3 border border-slate-800 rounded-xl text-sm text-slate-200 bg-slate-900/60 focus:outline-none"
              />
              <button
                className={`px-5 py-3 rounded-xl border border-transparent text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  copied
                    ? "bg-gather-accent text-white shadow-lg shadow-gather-accent/25"
                    : "bg-gather-accent text-white hover:bg-gather-accent-hover hover:-translate-y-px hover:shadow-lg hover:shadow-gather-accent/25"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleCopy}
                disabled={loading || !inviteLink}
              >
                {copied ? "✓ Đã copy" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tip: Nếu bạn dùng HTTP, hệ thống sẽ tự fallback để vẫn copy được.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              className="flex-1 min-w-[150px] px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-sm font-medium text-slate-200 cursor-pointer transition-all hover:bg-slate-800/50 hover:border-gather-accent/30 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (inviteLink) {
                  window.open(
                    `mailto:?subject=Tham gia phòng ${roomId}&body=Hãy tham gia phòng của tôi: ${inviteLink}`,
                    "_blank"
                  );
                }
              }}
              disabled={loading || !inviteLink}
            >
              Gửi qua Email
            </button>
            <button
              className="flex-1 min-w-[150px] px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-sm font-medium text-slate-200 cursor-pointer transition-all hover:bg-slate-800/50 hover:border-gather-accent/30 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (inviteLink) {
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(`Tham gia phòng ${roomId}: ${inviteLink}`)}`,
                    "_blank"
                  );
                }
              }}
              disabled={loading || !inviteLink}
            >
              Gửi qua WhatsApp
            </button>
          </div>

          {currentUserCount >= maxUsers && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm font-medium text-center">
              ⚠️ Phòng đã đầy ({maxUsers}/{maxUsers} người)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;



