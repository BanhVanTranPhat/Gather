import * as React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { getServerUrl } from "../../config/env";
import { useToast } from "../../contexts/ToastContext";

interface Props {
  onSuccess: (email: string, isNewUser: boolean) => void;
  onBack: () => void;
  onAuthSuccess?: (accessToken: string, refreshToken?: string) => void;
}

export default function EmailForm({ onSuccess, onBack, onAuthSuccess }: Props) {
  const serverUrl = getServerUrl();
  const [email, setEmail] = React.useState("");
  const { showToast } = useToast();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        );
        const profile = await userInfoRes.json();
        if (!userInfoRes.ok)
          throw new Error("Không lấy được thông tin Google profile");

        const authRes = await fetch(`${serverUrl}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            googleId: profile.sub,
            email: profile.email,
            username: profile.name || String(profile.email || "").split("@")[0],
            avatar: profile.picture,
          }),
        });
        const authData = await authRes.json().catch(() => ({}));
        if (!authRes.ok)
          throw new Error(authData.message || "Đăng nhập Google thất bại");

        if (authData.accessToken)
          localStorage.setItem("token", authData.accessToken);
        if (authData.refreshToken)
          localStorage.setItem("refreshToken", authData.refreshToken);
        if (authData.user)
          localStorage.setItem("user", JSON.stringify(authData.user));

        if (onAuthSuccess && authData.accessToken) {
          onAuthSuccess(authData.accessToken, authData.refreshToken);
        } else {
          onSuccess(profile.email, false);
        }
      } catch (err) {
        showToast("Lỗi đăng nhập Google: " + (err as Error).message, {
          variant: "error",
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${serverUrl}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSuccess(email, !data.exists);
    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  return (
    <div>
      {/* Header with Back */}
      <div className="flex items-center mb-8 relative">
        <button
          onClick={onBack}
          className="absolute left-0 p-2 -ml-2 text-slate-400 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-full transition-all"
          title="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="w-full text-2xl font-bold text-center text-slate-800 dark:text-white">
          Đăng nhập
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none transition-all text-slate-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 font-medium"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <button className="w-full px-4 py-3.5 font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          Tiếp theo
        </button>
      </form>

      {/* Separator */}
      <div className="relative flex items-center justify-center my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-600" />
        </div>
        <span className="relative px-4 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
          Hoặc tiếp tục với
        </span>
      </div>

      {/* Google Login */}
      <button
        type="button"
        onClick={() => googleLogin()}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold text-slate-700 dark:text-gray-200"
      >
        <FcGoogle size={22} />
        Đăng nhập bằng Google
      </button>
    </div>
  );
}
