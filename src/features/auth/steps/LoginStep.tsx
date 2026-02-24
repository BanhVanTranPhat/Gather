import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getServerUrl } from "../../../config/env";
import { useAuth } from "../../../hooks/useAuth";
import PasswordLogin from "../PasswordLogin";

const SERVER_URL = getServerUrl();

/**
 * Route: /auth/login
 * Reads email from location.state; falls back to "" (user must have navigated here directly).
 */
export default function LoginStep() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, hydrateUser } = useAuth();

  const email: string = (location.state as { email?: string })?.email ?? "";

  // Redirect to email step if no email in state (e.g. direct navigation)
  useEffect(() => {
    if (!email) navigate("/auth/email", { replace: true });
  }, [email, navigate]);

  const handleLoginSuccess = async (token: string, refreshToken?: string) => {
    login(token, refreshToken);
    const { needsAvatar } = await hydrateUser(email);
    navigate(needsAvatar ? "/auth/avatar" : "/home", { replace: true });
  };

  const handleForgotPassword = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Navigate to forgot-OTP step, carry email + success message
      navigate("/auth/forgot", { state: { email, message: data.message } });
    } catch (err) {
      // Let PasswordLogin handle toast display — rethrow so it can catch
      throw err;
    }
  };

  return (
    <PasswordLogin
      email={email}
      onBack={() => navigate(-1)}
      onForgotPassword={handleForgotPassword}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
