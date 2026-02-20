/**
 * Cấu hình môi trường dùng chung (frontend).
 * Một nguồn duy nhất cho base URL API / socket.
 */
export function getServerUrl(): string {
  return import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
}
