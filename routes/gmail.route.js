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

/** Render trang Gmail continue (OTP + form) theo mode=signup|signin */
router.get("/gmail", (req, res) => {
  const mode = req.query.mode === "signin" ? "signin" : "signup";
  res.render("vwAuth/gmail-continue", { layout: "auth", mode });
});

/** Gửi OTP tới email */
router.post("/gmail/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Missing email" });

    await sendOtpToEmail(email);
    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

/** Xác minh OTP */
router.post("/gmail/verify", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Missing email or otp" });
    }

    const valid = verifyOtp(email, otp);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("🔥 Error verifying OTP:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/** Hoàn tất ĐĂNG KÝ (signup) sau khi verify OTP */
router.post("/gmail/complete", async (req, res) => {
  try {
    const { username, password, confirmPassword, role } = req.body;

    if (!username || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: "Missing fields" });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    // Kiểm tra email đã tồn tại
    const existing = await checkUserExistsByEmail(username);
    if (existing)
      return res.status(400).json({ success: false, message: "Email already exists" });

    // Tạo user mới
    const newUser = await createGmailUser({
      email: username,
      password: password,
      role: role || "student",
    });

    // Tạo JWT tokens
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
    console.error("❌ Error completing Gmail signup:", err);
    if (err.code === "EMAIL_EXISTS") {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/gmail/signup", async (req, res) => {
  try {
    const { email, password, confirmPassword, role } = req.body;

    if (!email || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: "Missing fields" });

    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    // Kiểm tra email đã tồn tại
    const existing = await checkUserExistsByEmail(email);
    if (existing)
      return res.status(400).json({ success: false, message: "Email already exists" });

    // Tạo user mới
    const newUser = await createGmailUser({
      email: email,
      password: password,
      role: role || "student",
    });

    // Tạo JWT tokens
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
    console.error("❌ Error completing Gmail signup:", err);
    if (err.code === "EMAIL_EXISTS") {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


/** ĐĂNG NHẬP (signin) sau khi verify OTP */
router.post("/gmail/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Missing email or password" });

    // Lấy user từ database
    const user = await getUserByEmailForAuth(email);
    if (!user)
      return res.status(400).json({ success: false, message: "No account found" });

    // Xác thực password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid)
      return res.status(400).json({ success: false, message: "Wrong password" });

    // Tạo JWT tokens
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
    console.error("❌ Error Gmail signin:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
