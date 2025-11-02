// utils/emailOtp.js
import sgMail from "@sendgrid/mail";

const otpStore = new Map();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDGRID_SENDER_NAME = process.env.SENDER_NAME || "Online Academy";
const SENDGRID_ENABLED = Boolean(SENDGRID_API_KEY && SENDGRID_SENDER_EMAIL);

if (SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
  } catch (err) {
    console.error("❌ Failed to configure SendGrid:", err.message);
  }
}

export async function sendOtpToEmail(recipientEmail) {
  if (!recipientEmail) throw new Error("Missing recipient email");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otpStore.set(recipientEmail.toLowerCase(), { otp, expiresAt });

  if (!SENDGRID_ENABLED) {
    console.warn("⚠️ SendGrid not configured. Skipping OTP email send.");
    console.log(`OTP for ${recipientEmail}: ${otp}`);
    return otp;
  }

  const msg = {
    to: recipientEmail,
    from: {
      email: SENDGRID_SENDER_EMAIL,
      name: SENDGRID_SENDER_NAME,
    },
    subject: "🔐 Mã OTP xác thực tài khoản của bạn",
    headers: {
      "X-Mailer": "SendGrid-Node",
      "X-Priority": "1 (Highest)",
      "X-MSMail-Priority": "High",
      "Importance": "High",
      "List-Unsubscribe": "<mailto:no-reply@wepracademy.com>",
    },
    html: `
      <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px;">
        <div style="max-width:520px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
          <h2 style="color:#2563eb;text-align:center;">Xin chào 👋</h2>
          <p>Cảm ơn bạn đã sử dụng <strong>Online Academy</strong>.</p>
          <p>Mã OTP của bạn là:</p>
          <h1 style="color:#2563eb;text-align:center;letter-spacing:5px;font-size:36px;">${otp}</h1>
          <p style="text-align:center;">Mã này sẽ hết hạn sau <b>5 phút</b>.</p>
          <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
          <hr style="margin:20px 0;">
          <p style="font-size:12px;color:#9ca3af;text-align:center;">
            © ${new Date().getFullYear()} Web Programming Academy<br/>
            Email này được gửi tự động, vui lòng không trả lời.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ OTP sent to ${recipientEmail}`);
    return otp;
  } catch (err) {
    console.error("❌ Error sending OTP:", err.response?.body || err.message);
    otpStore.delete(recipientEmail.toLowerCase());
    throw new Error("Không thể gửi email OTP. Vui lòng thử lại sau.");
  }
}

export function verifyOtp(recipientEmail, userOtp) {
  if (!recipientEmail || !userOtp) return false;
  const record = otpStore.get(recipientEmail.toLowerCase());
  if (!record) return false;

  const { otp, expiresAt } = record;
  if (Date.now() > expiresAt) {
    otpStore.delete(recipientEmail.toLowerCase());
    return false;
  }

  const isValid = otp === userOtp;
  if (isValid) otpStore.delete(recipientEmail.toLowerCase());
  return isValid;
}

export async function sendPasswordResetEmail(recipientEmail, resetLink, recipientName = "") {
  if (!recipientEmail || !resetLink) {
    throw new Error("Missing email or reset link");
  }

  const displayName = recipientName || recipientEmail;

  if (!SENDGRID_ENABLED) {
    console.warn("⚠️ SendGrid not configured. Skipping password reset email send.");
    console.log(`Password reset link for ${recipientEmail}: ${resetLink}`);
    return;
  }

  const msg = {
    to: recipientEmail,
    from: {
      email: SENDGRID_SENDER_EMAIL,
      name: SENDGRID_SENDER_NAME,
    },
    subject: "🔐 Đặt lại mật khẩu của bạn",
    html: `
      <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px;">
        <div style="max-width:520px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
          <h2 style="color:#2563eb;">Xin chào ${displayName},</h2>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Online Academy</strong>.</p>
          <p>Nhấn vào nút bên dưới để tạo mật khẩu mới. Liên kết này sẽ hết hạn sau <strong>60 phút</strong>.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn vẫn an toàn.</p>
          <hr style="margin:20px 0;">
          <p style="font-size:12px;color:#9ca3af;text-align:center;">
            © ${new Date().getFullYear()} Web Programming Academy<br/>
            Email được gửi tự động, vui lòng không trả lời.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Password reset email sent to ${recipientEmail}`);
  } catch (err) {
    console.error("❌ Error sending password reset email:", err.response?.body || err.message);
    throw new Error("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.");
  }
}