import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

const InviteModal = ({ isOpen, onClose, roomId }: InviteModalProps) => {
  const { users, currentUser } = useSocket();
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      generateInviteLink();
    }
  }, [isOpen, roomId]);

  const generateInviteLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || "http://localhost:5001"}/api/rooms/${roomId}/invite`,
        {
          method: "POST",
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.inviteLink);
      }
    } catch (error) {
      console.error("Failed to generate invite link", error);
      // Fallback to manual link
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/lobby?room=${roomId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  if (!isOpen) return null;

  const currentUserCount = users.length + (currentUser ? 1 : 0);
  const maxUsers = 20;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-[90%] max-w-[500px] shadow-2xl animate-[modalSlideIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-gray-900">Mời người tham gia</h2>
          <button className="bg-none border-none text-2xl text-gray-500 cursor-pointer p-1 leading-none transition-colors hover:text-gray-800" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Phòng:</span>
              <span className="text-sm text-gray-900 font-semibold">{roomId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Số người:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {currentUserCount} / {maxUsers}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Link mời</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={loading ? "Đang tạo link..." : inviteLink}
                readOnly
                className="flex-1 px-3 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50"
              />
              <button
                className={`px-5 py-3 rounded-lg border-none text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-px"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleCopy}
                disabled={loading || !inviteLink}
              >
                {copied ? "✓ Đã copy" : "📋 Copy"}
              </button>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              className="flex-1 min-w-[150px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 cursor-pointer transition-all hover:bg-gray-100 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              📧 Gửi qua Email
            </button>
            <button
              className="flex-1 min-w-[150px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 cursor-pointer transition-all hover:bg-gray-100 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              💬 Gửi qua WhatsApp
            </button>
          </div>

          {currentUserCount >= maxUsers && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium text-center">
              ⚠️ Phòng đã đầy ({maxUsers}/{maxUsers} người)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;



