import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import EmailForm from "../EmailForm";

/**
 * Route: /auth/email
 * Checks if email exists; navigates to /auth/login or /auth/signup.
 * Passes email via route state for the next step.
 */
export default function EmailStep() {
  const navigate = useNavigate();
  const { login, hydrateUser } = useAuth();

  const handleEmailChecked = (email: string, isNewUser: boolean) => {
    // Pass email as route state so next step can read it
    const dest = isNewUser ? "/auth/signup" : "/auth/login";
    navigate(dest, { state: { email } });
  };

  // Google OAuth resolves here too (direct login from email step)
  const handleAuthSuccess = async (token: string, refreshToken?: string) => {
    login(token, refreshToken);
    const { needsAvatar } = await hydrateUser();
    navigate(needsAvatar ? "/auth/avatar" : "/home", { replace: true });
  };

  return (
    <EmailForm
      onSuccess={handleEmailChecked}
      onBack={() => navigate("/")}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}
