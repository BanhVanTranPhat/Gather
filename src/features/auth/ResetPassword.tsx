import * as React from "react";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { getServerUrl } from "../../config/env";
import { useToast } from "../../contexts/ToastContext";

interface Props {
  email: string;
  otp: string;
  onSuccess: () => void;
}

export default function ResetPassword({ email, otp, onSuccess }: Props) {
  const serverUrl = getServerUrl();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const { showToast } = useToast();

  const specialCharRe = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  const validations = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: specialCharRe.test(password),
    noSequence: !/(111|12345|abcde|qwert)/i.test(password),
  };

  const isValid =
    Object.values(validations).every(Boolean) && password === confirmPassword;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const res = await fetch(`${serverUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", {
        variant: "success",
      });
      onSuccess();
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
        Đặt lại mật khẩu
      </h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
        Tài khoản:{" "}
        <span className="font-semibold text-slate-700 dark:text-gray-200">
          {email}
        </span>
      </p>

      <div className="space-y-4">
        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1.5">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none transition-all text-slate-700 dark:text-gray-200 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {showPass ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-1.5">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none transition-all text-slate-700 dark:text-gray-200 pr-12"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {showConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1.5">Mật khẩu không khớp</p>
          )}
        </div>

        {/* Validation checklist */}
        <div className="bg-slate-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-sm space-y-3">
          <p className="font-semibold text-slate-700 dark:text-gray-200">
            Mật khẩu phải có ít nhất:
          </p>
          <ul className="space-y-1.5">
            <ValidationItem valid={validations.minLength} label="8 ký tự" />
            <ValidationItem valid={validations.hasLetter} label="1 chữ cái" />
            <ValidationItem valid={validations.hasUpper} label="1 chữ hoa" />
            <ValidationItem valid={validations.hasLower} label="1 chữ thường" />
            <ValidationItem valid={validations.hasNumber} label="1 số" />
            <ValidationItem
              valid={validations.hasSpecial}
              label="1 ký tự đặc biệt (!@#$...)"
            />
          </ul>
          <p className="font-semibold text-slate-700 dark:text-gray-200 pt-1">
            Không được chứa:
          </p>
          <ul className="space-y-1.5">
            <ValidationItem
              valid={validations.noSequence}
              label="Chuỗi liên tiếp (1111, 12345...)"
            />
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          Lưu mật khẩu mới
        </button>
      </div>
    </div>
  );
}
