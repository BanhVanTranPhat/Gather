import * as React from "react";
import { getServerUrl } from "../../config/env";
import { useToast } from "../../contexts/ToastContext";

interface Props {
  email: string;
  regData: { password: string; fullName: string };
  onBack: () => void;
  customVerifyAction?: (otp: string) => void;
  onRegisterSuccess?: (token: string) => void;
  title?: string;
  verifyButtonText?: string;
}

export default function RegisterVerify({
  email,
  regData,
  onBack,
  customVerifyAction,
  onRegisterSuccess,
  title,
  verifyButtonText,
}: Props) {
  const serverUrl = getServerUrl();
  const [otp, setOtp] = React.useState("");
  const { showToast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (customVerifyAction) {
      customVerifyAction(otp);
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: regData.password,
          fullName: regData.fullName,
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Đăng ký thành công! Chào mừng " + regData.fullName, {
        variant: "success",
      });

      if (onRegisterSuccess) {
        if (data.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        onRegisterSuccess(data.accessToken);
      } else {
        localStorage.setItem("token", data.accessToken);
        if (data.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        window.location.reload();
      }
    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  const displayTitle = title ?? "Kiểm tra Email";
  const displayButtonText = verifyButtonText ?? "Xác minh";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        {displayTitle}
      </h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
        Mã xác minh đã được gửi đến{" "}
        <span className="font-semibold text-slate-700 dark:text-gray-200">
          {email}
        </span>
      </p>

      <form onSubmit={handleRegister} className="space-y-5">
        <input
          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none transition-all text-slate-700 dark:text-gray-200 text-center text-lg font-bold tracking-[0.3em] placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="MÃ OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
          autoFocus
        />

        <button
          type="submit"
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          {displayButtonText}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="w-full mt-4 py-2.5 text-sm text-slate-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
      >
        Quay lại / Gửi lại mã
      </button>
    </div>
  );
}
