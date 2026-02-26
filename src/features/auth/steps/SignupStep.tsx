import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SignUpForm from "../SignUpForm";

/**
 * Route: /auth/signup
 * Reads email from location.state; on success navigates to /auth/verify.
 */
export default function SignupStep() {
  const navigate = useNavigate();
  const location = useLocation();

  const email: string = (location.state as { email?: string })?.email ?? "";

  useEffect(() => {
    if (!email) navigate("/auth/email", { replace: true });
  }, [email, navigate]);

  const handleInfoSubmitted = (data: {
    password: string;
    fullName: string;
  }) => {
    navigate("/auth/verify", { state: { email, ...data } });
  };

  return (
    <SignUpForm
      email={email}
      onSuccess={handleInfoSubmitted}
      onBack={() => navigate(-1)}
    />
  );
}
