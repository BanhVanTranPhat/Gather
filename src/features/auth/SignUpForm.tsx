import * as React from "react";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { getServerUrl } from "../../config/env";
import { useToast } from "../../contexts/ToastContext";

interface Props {
  email: string;
  onSuccess: (data: { password: string; fullName: string }) => void;
  onBack: () => void;
}

export default function SignUpForm({ email, onSuccess, onBack }: Props) {
  const serverUrl = getServerUrl();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const { showToast } = useToast();

  const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  const passValidations = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: specialCharRegex.test(password),
    noSequence: !/(123|abc|qwerty)/i.test(password),
  };

  const isPasswordStrong = Object.values(passValidations).every(Boolean);
  const isFormValid = isPasswordStrong && firstName.trim() && lastName.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast("Vui lòng nhập đầy đủ họ và tên.", { variant: "error" });
      return;
    }
    if (!isPasswordStrong) {
      showToast("Mật khẩu chưa đủ mạnh.", { variant: "error" });
      setShowTooltip(true);
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(`Mã xác thực đã gửi đến ${email}`, { variant: "success" });
      const fullName = `${firstName} ${lastName}`.trim();
      onSuccess({ password, fullName });
    } catch (err) {
      showToast((err as Error).message, { variant: "error" });
    }
  };

  const ValidationItem = ({
    valid,
    label,
  }: {
    valid: boolean;
    label: string;
  }) => (
    <li className="flex items-center gap-2">
      {valid ? (
        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
      )}
      <span
        className={
          valid
            ? "text-teal-600 dark:text-teal-400"
            : "text-slate-500 dark:text-gray-400"
        }
      >
        {label}
      </span>
    </li>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
        Tạo Tài Khoản
      </h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
        Nhập tên đầy đủ và mật khẩu để tiếp tục.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none transition-all text-slate-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Tên"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none transition-all text-slate-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Họ"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 focus:ring-4 outline-none transition-all text-slate-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 pr-12 ${
              showTooltip && !isPasswordStrong
                ? "border-red-300 dark:border-red-500 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/30"
                : "border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-100 dark:focus:ring-teal-900/30"
            }`}
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Password validation tooltip */}
        {showTooltip && (
          <div className="bg-slate-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm space-y-3">
            <p className="font-semibold text-slate-700 dark:text-gray-200">
              Mật khẩu phải bao gồm:
            </p>
            <ul className="space-y-1.5">
              <ValidationItem
                valid={passValidations.minLength}
                label="8 ký tự"
              />
              <ValidationItem valid={passValidations.hasNumber} label="1 số" />
              <ValidationItem
                valid={passValidations.hasUpper}
                label="1 chữ hoa"
              />
              <ValidationItem
                valid={passValidations.hasLower}
                label="1 chữ thường"
              />
              <ValidationItem
                valid={passValidations.hasSpecial}
                label="1 ký tự đặc biệt (!@#$%^&*...)"
              />
            </ul>
            <p className="font-semibold text-slate-700 dark:text-gray-200 pt-1">
              Không được có:
            </p>
            <ul className="space-y-1.5">
              <ValidationItem
                valid={passValidations.noSequence}
                label="Chuỗi dễ đoán (123, abc, qwerty...)"
              />
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          Tiếp tục
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="w-full mt-4 py-2.5 text-sm text-slate-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
      >
        Quay lại
      </button>
    </div>
  );
}
