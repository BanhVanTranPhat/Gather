import { Outlet, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import VideoDemo from "./VideoDemo";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/**
 * Shared layout for all /auth/* routes.
 * Left: VideoDemo panel | Right: auth form rendered via <Outlet>
 * Wraps children with GoogleOAuthProvider once.
 */
export default function AuthLayout() {
  const navigate = useNavigate();

  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID || "no-client-id-configured"}
    >
      <div className="min-h-screen flex bg-slate-50 dark:bg-gray-900">
        {/* Left: Video Demo (hidden on mobile) */}
        <VideoDemo />

        {/* Right: Auth Form */}
        <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-between min-h-screen bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 px-6 sm:px-10 py-8">
          {/* Logo */}
          <div>
            <div
              className="flex items-center gap-2.5 mb-10 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-9 h-9 bg-linear-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-200/50 dark:shadow-none">
                G
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
                The Gathering
              </span>
            </div>
          </div>

          {/* Auth step rendered here */}
          <div className="flex-1 flex items-center">
            <div className="w-full">
              <Outlet />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-6 pt-6 text-xs text-slate-400 dark:text-gray-500">
            <a
              href="#"
              className="hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            >
              Trợ giúp
            </a>
            <a
              href="#"
              className="hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            >
              Điều khoản
            </a>
            <a
              href="#"
              className="hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            >
              Quyền riêng tư
            </a>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
