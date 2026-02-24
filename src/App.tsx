import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useToast } from "./contexts/ToastContext";

// Auth
import AuthLayout from "./features/auth/AuthLayout";
import AuthPage from "./features/auth/AuthPage";
import SetNamePage from "./features/auth/SetNamePage";
import AvatarStep from "./features/auth/steps/AvatarStep";

// Pages
import LandingPage from "./pages/LandingPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import SettingsLayout from "./features/settings/SettingsLayout";
import AppPage from "./pages/AppPage";
import Library from "./pages/Library";

// Portal
import PortalDashboard from "./portal/dashboard/PortalDashboard";
import AdminDashboard from "./portal/admin/AdminDashboard";
import RequireAuth from "./portal/routing/RequireAuth";
import RequireAdmin from "./portal/routing/RequireAdmin";

// ─── Invite link handler (/?room=xxx) ───────────────────────────────────────
function InviteLinkHandler() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    const room = searchParams.get("room")?.trim();
    if (room) {
      localStorage.setItem("roomId", room);
      localStorage.setItem(
        "roomName",
        localStorage.getItem("roomName") || room,
      );
      showToast(`Đã chọn phòng: ${room}`, { variant: "success" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ─── Landing: redirect to /home if already logged in ────────────────────────
function LandingRoute() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Already logged in → go straight to home
  if (token) return <Navigate to="/home" replace />;

  return <LandingPage onJoin={() => navigate("/auth/email")} />;
}

// ─── App root ────────────────────────────────────────────────────────────────
export default function App() {
  const location = useLocation();

  return (
    <>
      <InviteLinkHandler />
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingRoute />} />

        {/* Auth flow — email + OTP in AuthPage, Google too */}
        <Route element={<AuthLayout />}>
          <Route path="/auth" element={<Navigate to="/auth/email" replace />} />
          <Route path="/auth/email" element={<AuthPage />} />
          {/* Back-compat: old routes → /auth/email */}
          <Route
            path="/auth/login"
            element={<Navigate to="/auth/email" replace />}
          />
          <Route
            path="/auth/signup"
            element={<Navigate to="/auth/email" replace />}
          />
          <Route
            path="/auth/verify"
            element={<Navigate to="/auth/email" replace />}
          />
          <Route
            path="/auth/forgot"
            element={<Navigate to="/auth/email" replace />}
          />
          <Route
            path="/auth/reset"
            element={<Navigate to="/auth/email" replace />}
          />
        </Route>

        {/* Name-setting onboarding (after first login) */}
        <Route
          path="/auth/name"
          element={
            <RequireAuth>
              <SetNamePage />
            </RequireAuth>
          }
        />

        {/* Avatar step — full screen, outside AuthLayout */}
        <Route
          path="/auth/avatar"
          element={
            <RequireAuth>
              <AvatarStep />
            </RequireAuth>
          }
        />

        {/* Home (post-login dashboard) */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsLayout onBack={() => window.history.back()} />
            </RequireAuth>
          }
        />

        {/* Workspace */}
        <Route path="/app/*" element={<AppPage />} />

        {/* Library */}
        <Route
          path="/library"
          element={
            <RequireAuth>
              <Library />
            </RequireAuth>
          }
        />

        {/* Portal */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <PortalDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        {/* Back-compat redirects */}
        <Route path="/login" element={<Navigate to="/auth/email" replace />} />
        <Route
          path="/lobby"
          element={
            <Navigate to={{ pathname: "/", search: location.search }} replace />
          }
        />
        <Route path="/spaces" element={<Navigate to="/app/chat" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
