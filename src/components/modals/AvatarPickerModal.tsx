import { useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { AVATAR_PRESETS } from "../../data/avatarPresets";
import { UserAvatarDisplay } from "../UserAvatarDisplay";
import { getServerUrl } from "../../config/env";
import { authFetch } from "../../utils/authFetch";

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  profileColor?: string;
  displayName?: string;
  onSelect: (avatar: string) => void;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar = "",
  profileColor,
  displayName,
  onSelect,
}: AvatarPickerModalProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serverUrl = getServerUrl();

  const handlePresetClick = (presetId: string) => {
    setError(null);
    onSelect(presetId);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP).");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload thất bại");
      const url = data?.file?.url;
      if (!url) throw new Error("Không nhận được URL ảnh");
      const fullUrl = url.startsWith("http") ? url : `${serverUrl}${url}`;
      onSelect(fullUrl);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Tải ảnh lên thất bại.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Chọn avatar</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-3">Avatar hiện tại:</p>
        <div className="flex justify-center mb-6">
          <UserAvatarDisplay
            avatar={currentAvatar}
            profileColor={profileColor}
            displayName={displayName}
            size="lg"
          />
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Avatar cơ bản</p>
        <div className="grid grid-cols-5 gap-2 mb-6">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset.id)}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl transition-colors border-2 border-transparent hover:border-gather-accent"
              title={preset.label}
            >
              {preset.emoji}
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Tải ảnh lên</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gather-accent hover:text-gather-accent hover:bg-gather-accent/5 transition-colors disabled:opacity-50"
        >
          {uploading ? "Đang tải lên…" : "Chọn ảnh từ máy"}
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
