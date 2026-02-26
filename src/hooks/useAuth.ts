import { getServerUrl } from "../config/env";
import { authFetch } from "../utils/authFetch";

const SERVER_URL = getServerUrl();

export interface UserProfile {
  email?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  profileColor?: string;
  role?: string;
  avatarConfig?: Record<string, unknown>;
}

function deriveNameFromEmail(email: string): string {
  const e = (email || "").trim();
  if (!e) return "guest";
  const at = e.indexOf("@");
  return (at > 0 ? e.slice(0, at) : e) || "guest";
}

function clearStorage(): void {
  const keys = [
    "token",
    "refreshToken",
    "user",
    "userName",
    "userAvatar",
    "roomId",
    "roomName",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
}

/**
 * Core auth utilities. Stateless — components bring their own useState if needed.
 * Use this hook wherever you need login/logout/hydrateUser.
 */
export function useAuth() {
  /** Save token(s) to storage after a successful login / registration. */
  const login = (token: string, refreshToken?: string) => {
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  };

  /** Clear all auth-related storage and redirect caller to /. */
  const logout = () => {
    clearStorage();
  };

  /**
   * Fetch /api/user/me and populate localStorage.
   * Returns `{ needsAvatar: boolean }` so callers can decide next route.
   */
  const hydrateUser = async (
    fallbackEmail = "",
  ): Promise<{ needsAvatar: boolean }> => {
    try {
      const res = await authFetch(`${SERVER_URL}/api/user/me`, {
        noRefresh: true,
      });

      if (res.ok) {
        const user: UserProfile = await res.json();
        localStorage.setItem("user", JSON.stringify(user));

        const userName =
          user.displayName ||
          user.username ||
          deriveNameFromEmail(user.email || fallbackEmail) ||
          "guest";
        localStorage.setItem("userName", userName);
        localStorage.setItem(
          "userAvatar",
          (user.avatar || userName.charAt(0) || "G").toUpperCase(),
        );

        const hasProfile =
          user.avatarConfig &&
          Object.keys(user.avatarConfig).length > 0 &&
          user.displayName?.trim();

        return { needsAvatar: !hasProfile };
      }

      // /me failed — store minimal fallback
      const fallbackName = deriveNameFromEmail(fallbackEmail);
      localStorage.setItem(
        "user",
        JSON.stringify({ email: fallbackEmail, username: fallbackName }),
      );
      localStorage.setItem("userName", fallbackName);
      localStorage.setItem("userAvatar", fallbackName.charAt(0).toUpperCase());

      return { needsAvatar: true };
    } catch {
      return { needsAvatar: true };
    }
  };

  /** Check if a stored token exists (synchronous). */
  const isAuthenticated = (): boolean => !!localStorage.getItem("token");

  /** Apply saved theme preference to <html>. */
  const applyTheme = () => {
    const isDark = localStorage.getItem("theme") === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  };

  return { login, logout, hydrateUser, isAuthenticated, applyTheme };
}
