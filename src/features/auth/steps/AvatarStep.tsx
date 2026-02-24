import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AvatarSelection from "../AvatarSelection";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/**
 * Route: /auth/avatar  (also accessible standalone, not inside AuthLayout)
 * Full-screen avatar selection after signup / first login.
 * On completion redirects to /home.
 */
export default function AvatarStep() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") ?? "";

  return (
    <GoogleOAuthProvider
      clientId={GOOGLE_CLIENT_ID || "no-client-id-configured"}
    >
      <AvatarSelection
        token={token}
        onSuccess={() => navigate("/home", { replace: true })}
      />
    </GoogleOAuthProvider>
  );
}
