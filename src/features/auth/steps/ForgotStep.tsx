import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useToast } from "../../../contexts/ToastContext";
import RegisterVerify from "../RegisterVerify";

interface ForgotState {
  email?: string;
  message?: string;
}

/**
 * Route: /auth/forgot
 * Verify OTP for password reset flow.
 * On success navigates to /auth/reset with otp in state.
 */
export default function ForgotStep() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const state = (location.state as ForgotState) ?? {};
  const email = state.email ?? "";

  useEffect(() => {
    if (!email) navigate("/auth/email", { replace: true });
    else if (state.message) showToast(state.message, { variant: "success" });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyOtp = async (otp: string) => {
    // Navigate with verified OTP to reset step
    navigate("/auth/reset", { state: { email, otp } });
  };

  return (
    <RegisterVerify
      email={email}
      regData={{ password: "", fullName: "" }}
      onBack={() => navigate(-1)}
      customVerifyAction={handleVerifyOtp}
      title="Đặt lại mật khẩu"
      verifyButtonText="Xác nhận mã"
    />
  );
}
