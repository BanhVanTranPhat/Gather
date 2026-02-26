import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ResetPassword from "../ResetPassword";

interface ResetState {
  email?: string;
  otp?: string;
}

/**
 * Route: /auth/reset
 * Password reset form. Reads email + otp from route state.
 * On success navigates back to /auth/login.
 */
export default function ResetStep() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as ResetState) ?? {};
  const email = state.email ?? "";
  const otp = state.otp ?? "";

  useEffect(() => {
    if (!email || !otp) navigate("/auth/email", { replace: true });
  }, [email, otp, navigate]);

  return (
    <ResetPassword
      email={email}
      otp={otp}
      onSuccess={() => navigate("/auth/login", { state: { email } })}
    />
  );
}
