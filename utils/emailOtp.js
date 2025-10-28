import nodemailer from "nodemailer";
import dotenv from "dotenv";

// 🔹 Load biến môi trường ngay khi file chạy
dotenv.config();

// Bộ nhớ tạm để lưu OTP
const otpStore = new Map();

/**
 * Gửi mã OTP đến email người dùng
 * @param {string} email - Email người nhận
 * @returns {string} otp - Mã OTP vừa gửi
 */
export async function sendOtpToEmail(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  try {
  // ✅ Tạo transporter Gmail ổn định trên localhost
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,          // dùng STARTTLS thay vì 465
    secure: false,      // false -> STARTTLS (ổn định hơn)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // ⚠️ chỉ dùng cho localhost
    },
  });

  // Cấu hình nội dung email
  const mailOptions = {
    from: `"WEPR Academy" <${process.env.EMAIL_USER}>`,
    to: email,
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

  // Gửi email
  const info = await transporter.sendMail(mailOptions);
  console.log("✅ OTP sent:", info.response);
  return otp;
} catch (error) {
  console.error("❌ Error sending OTP:", error);
  throw new Error("Failed to send OTP. Please try again.");
}

}

/**
 * Xác minh OTP người dùng nhập
 * @param {string} email - Email người dùng
 * @param {string} otp - OTP người dùng nhập
 * @returns {boolean} true nếu đúng, false nếu sai
 */
export function verifyOtp(email, otp) {
  const storedOtp = otpStore.get(email);
  if (storedOtp === otp) {
    otpStore.delete(email); // Xóa OTP sau khi dùng
    return true;
  }
  return false;
}
