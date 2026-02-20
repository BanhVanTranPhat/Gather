/**
 * Avatar cơ bản: preset (emoji) hoặc URL ảnh upload.
 * user.avatar có thể là: preset id (dog, cat, ...) hoặc URL (http.../api/uploads/...).
 */

export const AVATAR_PRESETS = [
  { id: "dog", emoji: "🐕", label: "Chó" },
  { id: "cat", emoji: "🐈", label: "Mèo" },
  { id: "panda", emoji: "🐼", label: "Gấu trúc" },
  { id: "fox", emoji: "🦊", label: "Cáo" },
  { id: "rabbit", emoji: "🐰", label: "Thỏ" },
  { id: "bear", emoji: "🐻", label: "Gấu" },
  { id: "lion", emoji: "🦁", label: "Sư tử" },
  { id: "owl", emoji: "🦉", label: "Cú" },
  { id: "tiger", emoji: "🐯", label: "Hổ" },
  { id: "monkey", emoji: "🐵", label: "Khỉ" },
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESETS)[number]["id"];

export function getPresetById(id: string): (typeof AVATAR_PRESETS)[number] | undefined {
  return AVATAR_PRESETS.find((p) => p.id === id);
}

/** Avatar là ảnh upload nếu là URL (http/https hoặc path /api/uploads/). */
export function isAvatarImageUrl(avatar: string | undefined): boolean {
  if (!avatar || typeof avatar !== "string") return false;
  return avatar.startsWith("http") || avatar.startsWith("/");
}

/** Avatar là preset id (dog, cat, ...). */
export function isAvatarPreset(avatar: string | undefined): boolean {
  if (!avatar) return false;
  return AVATAR_PRESETS.some((p) => p.id === avatar);
}
