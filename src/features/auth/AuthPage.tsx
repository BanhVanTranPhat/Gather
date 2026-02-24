import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, ArrowRight, RefreshCw, CheckCircle } from "lucide-react";
import { getServerUrl } from "../../config/env";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";

const SERVER_URL = getServerUrl();
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type Stage = "email" | "otp";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  // ─── State ──────────────────────────────────────────────────────
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // OTP box refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── Countdown timer ────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Auto-focus first OTP box when entering OTP stage
  useEffect(() => {
    if (stage === "otp") {
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    }
  }, [stage]);

  // ─── Email submit ────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Email không hợp lệ");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gửi OTP thất bại");
      showToast(data.message, { variant: "success" });
      setEmail(trimmed);
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(RESEND_SECONDS);
      setStage("otp");
    } catch (err: any) {
      setEmailError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP helpers ─────────────────────────────────────────────────
  const handleDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    setOtpError("");
    if (v && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    // Auto-submit when complete
    if (v && next.every((d) => d !== "")) {
      handleVerifyOtp(next.join(""));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && digits.every((d) => d !== "")) {
      handleVerifyOtp(digits.join(""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    // Focus last filled or last box
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === OTP_LENGTH) handleVerifyOtp(pasted);
  };

  // ─── OTP verify ─────────────────────────────────────────────────
  const handleVerifyOtp = async (code: string) => {
    setOtpError("");
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/otp-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.message || "Mã OTP không hợp lệ");
        setDigits(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      // Save tokens
      login(data.accessToken, data.refreshToken);

      // Save user info
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        const name =
          data.user.displayName || data.user.username || email.split("@")[0];
        localStorage.setItem("userName", name);
        localStorage.setItem("userAvatar", (name[0] || "G").toUpperCase());
      }

      // Navigate based on whether user has a displayName
      const hasName = !!data.user?.displayName?.trim();
      navigate(hasName ? "/home" : "/auth/name", { replace: true });
    } catch (err: any) {
      setOtpError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ─────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Mã mới đã được gửi!", { variant: "success" });
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setCountdown(RESEND_SECONDS);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: any) {
      showToast(err.message || "Gửi lại thất bại", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [countdown, email, showToast]);

  // ─── Google OAuth ────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      // Decode Google JWT to get user info
      const payload = JSON.parse(
        atob(credentialResponse.credential.split(".")[1]),
      );
      const res = await fetch(`${SERVER_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: payload.sub,
          email: payload.email,
          username: payload.email.split("@")[0],
          avatar: payload.picture,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng nhập Google thất bại");

      login(data.accessToken, data.refreshToken);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        const name =
          data.user.displayName ||
          data.user.username ||
          payload.name ||
          payload.email.split("@")[0];
        localStorage.setItem("userName", name);
        localStorage.setItem(
          "userAvatar",
          payload.picture || (name[0] || "G").toUpperCase(),
        );
      }

      const hasName = !!data.user?.displayName?.trim();
      navigate(hasName ? "/home" : "/auth/name", { replace: true });
    } catch (err: any) {
      showToast(err.message || "Đăng nhập Google thất bại", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {/* ── Stage: Email ── */}
        {stage === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              Chào mừng
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-8">
              Nhập email để đăng nhập hoặc tạo tài khoản mới
            </p>

            {/* Email input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="auth-email"
                  type="email"
                  autoFocus
                  autoComplete="email"
                  placeholder="ban@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-700 dark:text-white placeholder-slate-400 outline-none transition-all
                    ${
                      emailError
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900"
                    }`}
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-xs text-red-500">{emailError}</p>
              )}
            </div>

            <button
              id="auth-send-otp-btn"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-teal-200 dark:shadow-none"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Nhận mã xác thực <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              <span className="text-xs text-slate-400">hoặc</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            </div>

            {/* Google */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  showToast("Đăng nhập Google thất bại", { variant: "error" })
                }
                useOneTap={false}
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
                locale="vi"
              />
            </div>
          </motion.div>
        )}

        {/* ── Stage: OTP ── */}
        {stage === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => {
                setStage("email");
                setOtpError("");
                setDigits(Array(OTP_LENGTH).fill(""));
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 mb-6 transition-colors"
            >
              ← Thay đổi email
            </button>

            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              Nhập mã xác thực
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-2">
              Mã 6 chữ số đã gửi tới
            </p>
            <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mb-8 truncate">
              {email}
            </p>

            {/* 6-digit input boxes */}
            <div
              className="flex gap-2.5 mb-4 justify-center"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-all bg-white dark:bg-gray-700 dark:text-white
                    ${d ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30" : "border-gray-200 dark:border-gray-600"}
                    ${otpError ? "border-red-400 bg-red-50 dark:bg-red-900/20" : ""}
                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900`}
                  disabled={loading}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-center text-xs text-red-500 mb-4">
                {otpError}
              </p>
            )}

            {/* Verify button (manual, for keyboard users) */}
            <button
              id="auth-verify-otp-btn"
              onClick={() => {
                if (digits.every((d) => d !== ""))
                  handleVerifyOtp(digits.join(""));
              }}
              disabled={loading || digits.some((d) => d === "")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all disabled:opacity-50 mb-4 shadow-sm shadow-teal-200 dark:shadow-none"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Xác nhận mã
                </>
              )}
            </button>

            {/* Resend */}
            <p className="text-center text-xs text-slate-400">
              Không nhận được mã?{" "}
              {countdown > 0 ? (
                <span className="text-slate-500">Gửi lại sau {countdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50"
                >
                  Gửi lại ngay
                </button>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
