// utils/emailOtp.js (mã mẫu đã cập nhật)
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// OTP store: Map<email, { otp: string, expiresAt: number }>
const otpStore = new Map();

// --- Helpers: build accounts list from env ---
function loadEmailAccountsFromEnv() {
  const accounts = [];

  // Tối thiểu có EMAIL_USER / EMAIL_PASS
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    accounts.push({ user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS, isDefault: true });
  }

  // Hỗ trợ EMAIL_USER_2 / EMAIL_PASS_2, EMAIL_USER_3 / EMAIL_PASS_3, ...
  // (tìm tối đa 10 để an toàn)
  for (let i = 2; i <= 10; i++) {
    const u = process.env[`EMAIL_USER_${i}`];
    const p = process.env[`EMAIL_PASS_${i}`];
    if (u && p) accounts.push({ user: u, pass: p, isDefault: false });
  }

  return accounts;
}

const emailAccounts = loadEmailAccountsFromEnv();

if (emailAccounts.length === 0) {
  console.warn("⚠️ No email accounts configured in .env (EMAIL_USER / EMAIL_PASS). OTP sending will fail.");
}

// --- Select account: nếu recipient trùng một account.user thì dùng account đó ---
// Nếu không trùng, dùng tài khoản mặc định (first account marked isDefault hoặc first)
function selectAccountForRecipient(recipientEmail) {
  if (!recipientEmail) return emailAccounts[0] || null;
  // tìm chính xác
  const exact = emailAccounts.find(a => a.user.toLowerCase() === recipientEmail.toLowerCase());
  if (exact) return exact;
  // else return default (first isDefault or first)
  const def = emailAccounts.find(a => a.isDefault) || emailAccounts[0];
  return def || null;
}

// --- Create transporter for chosen account ---
function createTransporterForAccount(account) {
  if (!account) throw new Error("No email account available for sending OTP");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: account.user,
      pass: account.pass,
    },
    tls: {
      rejectUnauthorized: false, // chỉ dùng localhost/dev (production nên để true)
    },
  });
}

// --- Public: sendOtpToEmail(recipient) ---
export async function sendOtpToEmail(recipientEmail) {
  if (!recipientEmail) throw new Error("Missing recipient email");

  // tạo OTP 6 chữ số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // lưu kèm expiry (5 phút)
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(recipientEmail.toLowerCase(), { otp, expiresAt });

  // chọn account phù hợp
  const account = selectAccountForRecipient(recipientEmail);
  if (!account) throw new Error("No configured sending account");

  const transporter = createTransporterForAccount(account);

  const mailOptions = {
    from: `"WEPR Academy" <${account.user}>`,
    to: recipientEmail,
    subject: "Your OTP Code 🔐",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #4285f4;">OTP Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 3px; color: #34a853;">${otp}</h1>
        <p>This code will expire in <b>5 minutes</b>.</p>
        <hr />
        <p style="font-size: 12px; color: #888;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${recipientEmail} using ${account.user}:`, info.response);
    return otp;
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    // nếu gửi lỗi (ví dụ credential sai), xoá OTP đã lưu để tránh lộn xộn
    otpStore.delete(recipientEmail.toLowerCase());
    throw new Error("Failed to send OTP. Please try again later.");
  }
}

// --- Public: verifyOtp(email, otp) ---
export function verifyOtp(email, otp) {
  if (!email || !otp) return false;
  const key = email.toLowerCase();
  const rec = otpStore.get(key);
  if (!rec) return false;

  // check expiry
  if (Date.now() > rec.expiresAt) {
    otpStore.delete(key);
    return false;
  }

  if (rec.otp === otp) {
    otpStore.delete(key);
    return true;
  }

  return false;
}

// (tuỳ chọn) Hàm dọn OTP hết hạn (có thể gọi định kỳ nếu muốn)
export function pruneExpiredOtps() {
  const now = Date.now();
  for (const [email, { expiresAt }] of otpStore.entries()) {
    if (expiresAt <= now) otpStore.delete(email);
  }
}
