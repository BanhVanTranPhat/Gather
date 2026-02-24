import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCircle, Sparkles, RefreshCw } from "lucide-react";
import { getServerUrl } from "../../config/env";
import { useToast } from "../../contexts/ToastContext";

const SERVER_URL = getServerUrl();

/**
 * Route: /auth/name (RequireAuth)
 * First-time onboarding: user sets their display name after OTP or Google login.
 */
export default function SetNamePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (trimmed.length < 2) {
      setError("Tên phải có ít nhất 2 ký tự");
      return;
    }
    if (trimmed.length > 50) {
      setError("Tên tối đa 50 ký tự");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${SERVER_URL}/api/user/display-name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");

      // Update local storage
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          const user = JSON.parse(raw);
          user.displayName = trimmed;
          localStorage.setItem("user", JSON.stringify(user));
        } catch {
          /* ignore */
        }
      }
      localStorage.setItem("userName", trimmed);
      localStorage.setItem("userAvatar", trimmed.charAt(0).toUpperCase());

      showToast(`Chào mừng, ${trimmed}! 🎉`, { variant: "success" });
      navigate("/home", { replace: true });
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-teal-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 px-8 py-10">
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4">
              <UserCircle className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center">
              Bạn muốn được gọi là gì?
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 text-center mt-2">
              Tên này sẽ hiển thị với mọi người trong không gian làm việc
            </p>
          </div>

          {/* Input */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-600 dark:text-gray-300 mb-1.5">
              Tên hiển thị
            </label>
            <input
              id="set-name-input"
              type="text"
              autoFocus
              autoComplete="name"
              placeholder="Ví dụ: Phát Bành, John..."
              value={name}
              maxLength={50}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-gray-700 dark:text-white placeholder-slate-400 outline-none transition-all
                ${
                  error
                    ? "border-red-400 focus:ring-2 focus:ring-red-200"
                    : "border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900"
                }`}
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          </div>

          {/* Submit */}
          <button
            id="set-name-submit-btn"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-teal-200 dark:shadow-none"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Vào The Gathering
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-4">
            Bạn có thể thay đổi tên này sau trong phần cài đặt
          </p>
        </div>
      </motion.div>
    </div>
  );
}
