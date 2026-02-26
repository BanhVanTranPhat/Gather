import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../contexts/ToastContext";
import RegisterVerify from "../RegisterVerify";

interface VerifyState {
  email?: string;
  password?: string;
  fullName?: string;
}

/**
 * Route: /auth/verify
 * Handles OTP verification for new registration.
 * Reads email + registration data from route state.
 */
export default function VerifyStep() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, hydrateUser } = useAuth();
  const { showToast } = useToast();

  const state = (location.state as VerifyState) ?? {};
  const email = state.email ?? "";

  useEffect(() => {
    if (!email) navigate("/auth/email", { replace: true });
  }, [email, navigate]);

  const handleRegisterSuccess = async (
    token: string,
    refreshToken?: string,
  ) => {
    login(token, refreshToken);
    const { needsAvatar } = await hydrateUser(email);
    showToast("Đăng ký thành công! Chào mừng bạn 🎉", { variant: "success" });
    navigate(needsAvatar ? "/auth/avatar" : "/home", { replace: true });
  };

  return (
    <RegisterVerify
      email={email}
      regData={{
        password: state.password ?? "",
        fullName: state.fullName ?? "",
      }}
      onBack={() => navigate(-1)}
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
}
