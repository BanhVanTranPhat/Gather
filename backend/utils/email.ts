import nodemailer from "nodemailer";

const APP_NAME = "The Gathering";

function getTransporter() {
  const user = (process.env.EMAIL_USER || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  const pass = (process.env.EMAIL_PASS || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send OTP email. Uses Gmail SMTP if EMAIL_USER/EMAIL_PASS are set.
 * Otherwise logs to console (dev) and returns false.
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: "register" | "reset",
): Promise<boolean> {
  const transporter = getTransporter();
  const subject =
    purpose === "register"
      ? `[${APP_NAME}] Mã xác thực đăng ký`
      : `[${APP_NAME}] Mã đặt lại mật khẩu`;
  const text =
    purpose === "register"
      ? `Mã xác thực đăng ký của bạn là: ${code}. Mã có hiệu lực 10 phút.`
      : `Mã đặt lại mật khẩu của bạn là: ${code}. Mã có hiệu lực 10 phút.`;

  if (!transporter) {
    console.log(`\n┌─────────────────────────────────────────┐`);
    console.log(`│  🔑 DEV OTP  →  ${code}  (${to})`);
    console.log(`└─────────────────────────────────────────┘\n`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${(process.env.EMAIL_USER || "").trim().replace(/^["']|["']$/g, "")}>`,
      to,
      subject,
      text,
      html: `
        <p>Xin chào,</p>
        <p>Mã xác thực của bạn là: <strong style="font-size:20px;letter-spacing:2px;">${code}</strong></p>
        <p>Mã có hiệu lực trong 10 phút.</p>
        <p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
        <p>— ${APP_NAME}</p>
      `,
    });
    console.log(`[Email] Đã gửi OTP đến ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Gửi thất bại:", err);
    return false;
  }
}

export interface EventEmailDetails {
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  eventId: string;
}

/**
 * Gửi email xác nhận khi user đăng ký tham gia event (book/RSVP "going").
 */
export async function sendEventConfirmation(
  to: string,
  event: EventEmailDetails,
): Promise<boolean> {
  const transporter = getTransporter();
  const start = new Date(event.startTime);
  const subject = `[${APP_NAME}] Đã đăng ký: ${event.title}`;
  const text = `Bạn đã đăng ký tham gia "${event.title}" vào ${start.toLocaleString("vi-VI")}.`;

  if (!transporter) {
    console.log(
      `[Email] Event confirmation không gửi – chưa cấu hình SMTP. Would send to ${to}: ${event.title}`,
    );
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${(process.env.EMAIL_USER || "").trim().replace(/^["']|["']$/g, "")}>`,
      to,
      subject,
      text,
      html: `
        <p>Xin chào,</p>
        <p>Bạn đã đăng ký tham gia sự kiện:</p>
        <p><strong>${event.title}</strong></p>
        <p>Thời gian: ${start.toLocaleString("vi-VI")}</p>
        ${event.location ? `<p>Địa điểm: ${event.location}</p>` : ""}
        <p>— ${APP_NAME}</p>
      `,
    });
    console.log(`[Email] Đã gửi xác nhận event đến ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Gửi event confirmation thất bại:", err);
    return false;
  }
}

/**
 * Gửi email nhắc nhở trước khi event diễn ra (dùng trong cron reminder).
 */
export async function sendEventReminder(
  to: string,
  event: EventEmailDetails,
): Promise<boolean> {
  const transporter = getTransporter();
  const start = new Date(event.startTime);
  const subject = `[${APP_NAME}] Nhắc nhở: ${event.title} sắp diễn ra`;
  const text = `Sự kiện "${event.title}" sẽ bắt đầu lúc ${start.toLocaleString("vi-VI")}.`;

  if (!transporter) {
    console.log(
      `[Email] Event reminder không gửi – chưa cấu hình SMTP. Would send to ${to}: ${event.title}`,
    );
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${(process.env.EMAIL_USER || "").trim().replace(/^["']|["']$/g, "")}>`,
      to,
      subject,
      text,
      html: `
        <p>Xin chào,</p>
        <p>Nhắc nhở: Sự kiện <strong>${event.title}</strong> sắp diễn ra.</p>
        <p>Thời gian: ${start.toLocaleString("vi-VI")}</p>
        ${event.location ? `<p>Địa điểm: ${event.location}</p>` : ""}
        <p>— ${APP_NAME}</p>
      `,
    });
    console.log(`[Email] Đã gửi reminder event đến ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Gửi event reminder thất bại:", err);
    return false;
  }
}
