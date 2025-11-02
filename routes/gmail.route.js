// routes/gmail.route.js
import express from "express";
import { sendOtpToEmail, verifyOtp } from "../utils/emailOtp.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { addRefreshToken } from "../utils/token-store.js";
import {
  checkUserExistsByEmail,
  createGmailUser,
  getUserByEmailForAuth,
  verifyPassword,
  buildAuthPayload,
  getDashboardRedirectByRole,
} from "../models/gmail.model.js";

const router = express.Router();

/** Render trang OTP */
router.get("/gmail", (req, res) => {
  const mode = req.query.mode === "signin" ? "signin" : "signup";
  res.render("vwAuth/gmail-continue", { layout: "auth", mode });
});

/** Gửi OTP */
router.post("/gmail/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Thiếu địa chỉ email." });

    await sendOtpToEmail(email);
    return res.json({ success: true, message: "✅ Mã OTP đã được gửi đến email của bạn!" });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    return res.status(500).json({ success: false, message: "Không thể gửi OTP. Vui lòng thử lại." });
  }
});

/** Xác minh OTP */
router.post("/gmail/verify", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Thiếu email hoặc mã OTP." });

    const valid = verifyOtp(email, otp);
    if (!valid)
      return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn." });

    return res.json({ success: true, message: "✅ OTP xác minh thành công!" });
  } catch (err) {
    console.error("🔥 Lỗi xác minh OTP:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

/** Đăng ký sau khi OTP hợp lệ */
router.post("/gmail/complete", async (req, res) => {
  try {
    const { username, password, confirmPassword, role } = req.body;
    if (!username || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: "Thiếu thông tin đăng ký." });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Mật khẩu không khớp." });

    const existing = await checkUserExistsByEmail(username);
    if (existing)
      return res.status(400).json({ success: false, message: "Email đã tồn tại." });

    const newUser = await createGmailUser({ email: username, password, role });

    const payload = buildAuthPayload(newUser);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(newUser.id, refreshToken);

    res.cookie("access_token", accessToken, { httpOnly: true, sameSite: "lax" });
    res.cookie("refresh_token", refreshToken, { httpOnly: true, sameSite: "lax" });

    return res.json({
      success: true,
      redirect: getDashboardRedirectByRole(newUser.role),
    });
  } catch (err) {
    console.error("❌ Error completing signup:", err);
    return res.status(500).json({ success: false, message: "Đăng ký thất bại. Vui lòng thử lại." });
  }
});

/** 🟢 Alias cho /gmail/signup (để frontend vẫn hoạt động) */
router.post("/gmail/signup", async (req, res, next) => {
  req.url = "/gmail/complete"; // nội bộ chuyển tiếp sang route /gmail/complete
  router.handle(req, res, next);
});

/** Đăng nhập */
router.post("/gmail/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Thiếu email hoặc mật khẩu." });

    const user = await getUserByEmailForAuth(email);
    if (!user)
      return res.status(400).json({ success: false, message: "Không tìm thấy tài khoản." });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok)
      return res.status(400).json({ success: false, message: "Sai mật khẩu." });

    const payload = buildAuthPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(user.id, refreshToken);

    res.cookie("access_token", accessToken, { httpOnly: true, sameSite: "lax" });
    res.cookie("refresh_token", refreshToken, { httpOnly: true, sameSite: "lax" });

    return res.json({
      success: true,
      redirect: getDashboardRedirectByRole(user.role),
    });
  } catch (err) {
    console.error("❌ Error signin:", err);
    return res.status(500).json({ success: false, message: "Đăng nhập thất bại." });
  }
});

export default router;
