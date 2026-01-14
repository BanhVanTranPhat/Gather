import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Link, useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google: any;
  }
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, recaptchaToken }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/lobby");
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // Load Google Identity Services
      if (!window.google) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        callback: async (response: any) => {
          try {
            // Decode JWT token (simple decode, not verification for client-side)
            const base64Url = response.credential.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
            );
            const credential = JSON.parse(jsonPayload);

            // Send to backend
            const authResponse = await fetch(
              `${
                import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
              }/api/auth/google`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  googleId: credential.sub,
                  email: credential.email,
                  username: credential.name || credential.email.split("@")[0],
                  avatar: credential.picture,
                }),
              }
            );

            const data = await authResponse.json();

            if (authResponse.ok) {
              localStorage.setItem("token", data.token);
              localStorage.setItem("user", JSON.stringify(data.user));
              navigate("/lobby");
            } else {
              setError(data.message || "Đăng nhập Google thất bại");
            }
          } catch (err) {
            setError("Lỗi xử lý đăng nhập Google");
          } finally {
            setLoading(false);
          }
        },
      });

      // Prompt sign-in
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: show button
          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-button") as HTMLElement,
            {
              theme: "outline",
              size: "large",
              width: "100%",
            }
          );
        }
      });
    } catch (err) {
      setError("Không thể tải Google Sign-In. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-8">
      <div className="w-full max-w-[400px] bg-white rounded-xl p-10 shadow-2xl">
        <div className="text-center mb-8">
          <button
            className="absolute top-6 left-6 bg-transparent border-none text-gray-500 font-semibold cursor-pointer text-[0.95rem] hover:text-gray-900"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800 no-underline mb-6"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              G
            </div>
            <span>Gather</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Đăng nhập</h1>
          <p className="text-gray-600 text-sm">
            Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
              className="px-3 py-3 border border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="px-3 py-3 border border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)]"
            />
          </div>

          <div className="flex justify-center my-4">
            {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
              />
            )}
          </div>

          <button
            type="submit"
            className="px-3 py-3 bg-blue-600 text-white border-none rounded-md text-base font-semibold cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={
              loading ||
              (!!import.meta.env.VITE_RECAPTCHA_SITE_KEY && !recaptchaToken)
            }
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="flex items-center text-center my-6 text-gray-400 text-sm before:content-[''] before:flex-1 before:border-b before:border-gray-300 after:content-[''] after:flex-1 after:border-b after:border-gray-300">
          <span className="px-4">Hoặc</span>
        </div>

        <button
          type="button"
          className="w-full px-3 py-3 bg-white text-gray-700 border border-gray-300 rounded-md text-base font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.044l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.288C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Đăng nhập với Google
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-blue-600 no-underline font-medium hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
