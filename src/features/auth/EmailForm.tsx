import * as React from "react";
import { useGoogleLogin } from "@react-oauth/google";
// Thêm FaArrowLeft
import { FaApple, FaFacebook, FaMicrosoft, FaKey, FaArrowLeft } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from "../../contexts/ToastContext";

interface Props {
  onSuccess: (email: string, isNewUser: boolean) => void;
  // 👇 THÊM PROP NÀY ĐỂ XỬ LÝ QUAY LẠI
  onBack: () => void;
  onAuthSuccess?: (accessToken: string, refreshToken?: string) => void;
}

// Nhận thêm prop onBack
export default function EmailForm({ onSuccess, onBack, onAuthSuccess }: Props) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
  const [email, setEmail] = React.useState("");
  const { showToast } = useToast();

  // Xử lý Google Login
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch Google profile
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await userInfoRes.json();
        if (!userInfoRes.ok) throw new Error("Không lấy được thông tin Google profile");

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
        if (!authRes.ok) throw new Error(authData.message || "Đăng nhập Google thất bại");

        // Store tokens for session management
        if (authData.accessToken) localStorage.setItem("token", authData.accessToken);
        if (authData.refreshToken) localStorage.setItem("refreshToken", authData.refreshToken);
        if (authData.user) localStorage.setItem("user", JSON.stringify(authData.user));

        if (onAuthSuccess && authData.accessToken) {
          onAuthSuccess(authData.accessToken, authData.refreshToken);
        } else {
          // Fallback: continue flow as "existing user" using returned email
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100 relative">
      
      {/* --- 1. HEADER VỚI NÚT BACK --- */}
      <div className="flex items-center mb-8 relative">
        {/* Nút Back */}
        <button 
            onClick={onBack}
            className="absolute left-0 p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
            title="Quay lại"
        >
            <FaArrowLeft size={20} />
        </button>
        {/* Tiêu đề căn giữa */}
        <h1 className="w-full text-2xl font-bold text-center text-gray-800">
          Đăng nhập
        </h1>
      </div>


      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 text-gray-700 placeholder-gray-400 font-medium"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <button
          className="w-full px-4 py-3.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          Tiếp theo
        </button>
      </form>

      {/* Separator */}
      <div className="relative flex items-center justify-center my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative px-4 bg-white text-sm font-medium text-gray-500">Hoặc tiếp tục với</span>
      </div>

      {/* --- 2. SOCIAL ICONS ĐẸP HƠN, TÁCH RỜI HƠN --- */}
      <div className="flex justify-center gap-6"> {/* Tăng gap lên 6 */}
        <SocialButton title="SSO" onClick={() => {}}>
          <FaKey className="text-gray-600" />
        </SocialButton>

        <SocialButton title="Apple" onClick={() => {}}>
          <FaApple className="text-gray-900" />
        </SocialButton>

        <SocialButton title="Google" onClick={() => googleLogin()}>
          <FcGoogle />
        </SocialButton>

        <SocialButton title="Facebook" onClick={() => {}}>
          <FaFacebook className="text-[#1877F2]" />
        </SocialButton>

        <SocialButton title="Microsoft" onClick={() => {}}>
          <FaMicrosoft className="text-[#F25022]" />
        </SocialButton>
      </div>
    </div>
  );
}

// Component phụ: Nút Social được cải tiến
const SocialButton = ({ 
  children, 
  title, 
  onClick 
}: { 
  children: React.ReactNode; 
  title: string; 
  onClick: () => void;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    // Thêm p-4, shadow-sm, hover:shadow-md, hover:-translate-y-1
    className="p-4 bg-white border-2 border-gray-100 rounded-full hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-2xl flex items-center justify-center"
  >
    {children}
  </button>
);