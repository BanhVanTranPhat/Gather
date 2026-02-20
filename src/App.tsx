import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LegacyAuthFlow from "./LegacyAuthFlow";

import AppPage from "./pages/AppPage";
import Library from "./pages/Library";
import PortalDashboard from "./portal/dashboard/PortalDashboard";
import AdminDashboard from "./portal/admin/AdminDashboard";
import RequireAuth from "./portal/routing/RequireAuth";
import RequireAdmin from "./portal/routing/RequireAdmin";

export default function App() {
  const location = useLocation();
  return (
    <Routes>
      <Route
        path="/lobby"
        element={
          <Navigate to={{ pathname: "/", search: location.search }} replace />
        }
      />
      <Route path="/spaces" element={<Navigate to="/app/chat" replace />} />
      <Route path="/app/*" element={<AppPage />} />
      <Route
        path="/library"
        element={
          <RequireAuth>
            <Library />
          </RequireAuth>
        }
      />
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

      {/* Back-compat: old flow lives at "/" */}
      <Route path="/" element={<LegacyAuthFlow />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
