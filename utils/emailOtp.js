// utils/emailOtp.js
import sgMail from "@sendgrid/mail";

const otpStore = new Map();

// Set SendGrid key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendOtpToEmail(recipientEmail) {
  if (!recipientEmail) throw new Error("Missing recipient email");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otpStore.set(recipientEmail.toLowerCase(), { otp, expiresAt });

  const msg = {
    to: recipientEmail,
    from: {
      email: process.env.SENDER_EMAIL,
      name: process.env.SENDER_NAME,
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
