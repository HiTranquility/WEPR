import express from "express";
import bcrypt from "bcrypt";
import { supabase } from "../utils/supabaseClient.js";
import { sendOtpToEmail, verifyOtp } from "../utils/emailOtp.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { addRefreshToken } from "../utils/token-store.js";

const router = express.Router();

/** Render trang Gmail continue (OTP + form) theo mode=signup|signin */
router.get("/", (req, res) => {
  const mode = req.query.mode === "signin" ? "signin" : "signup";
  res.render("vwAuth/gmail-continue", { layout: "auth", mode });
});

/** Gửi OTP tới email */
router.post("/send-otp", async (req, res) => {
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
router.post("/verify", (req, res) => {
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
router.post("/complete", async (req, res) => {
  try {
    const { username, password, confirmPassword, role } = req.body;

    if (!username || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: "Missing fields" });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    // đã tồn tại?
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", username)
      .single();

    if (existing)
      return res.status(400).json({ success: false, message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("users")
      .insert([{
        full_name: username.split("@")[0],
        email: username,
        password_hash: hashed,
        role: role || "student",
      }])
      .select()
      .single();

    if (error) throw error;

    const payload = { id: data.id, role: data.role, name: data.full_name, email: data.email };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(data.id, refreshToken);

    res.cookie("access_token", accessToken,  { httpOnly: true, sameSite: "lax" });
    res.cookie("refresh_token", refreshToken,{ httpOnly: true, sameSite: "lax" });

    return res.json({
      success: true,
      redirect: data.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
    });
  } catch (err) {
    console.error("❌ Error completing Gmail signup:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password, confirmPassword, role } = req.body;

    if (!email || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: "Missing fields" });

    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    // kiểm tra đã tồn tại chưa
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing)
      return res.status(400).json({ success: false, message: "Email already exists" });

    // thêm user mới
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name: email.split("@")[0],
          email,
          password_hash: hashed,
          role: role || "student",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // tạo JWT cookie
    const payload = {
      id: data.id,
      role: data.role,
      name: data.full_name,
      email: data.email,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(data.id, refreshToken);

    res.cookie("access_token", accessToken, { httpOnly: true, sameSite: "lax" });
    res.cookie("refresh_token", refreshToken, { httpOnly: true, sameSite: "lax" });

    return res.json({
      success: true,
      redirect:
        data.role === "teacher"
          ? "/teacher/dashboard"
          : "/student/dashboard",
    });
  } catch (err) {
    console.error("❌ Error completing Gmail signup:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


/** ĐĂNG NHẬP (signin) sau khi verify OTP */
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Missing email or password" });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, password_hash")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(400).json({ success: false, message: "No account found" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(400).json({ success: false, message: "Wrong password" });

    const payload = {
      id: user.id,
      role: user.role,
      name: user.full_name,
      email: user.email,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(user.id, refreshToken);

    res.cookie("access_token", accessToken, { httpOnly: true, sameSite: "lax" });
    res.cookie("refresh_token", refreshToken, { httpOnly: true, sameSite: "lax" });

    return res.json({
      success: true,
      redirect:
        user.role === "teacher"
          ? "/teacher/dashboard"
          : "/student/dashboard",
    });
  } catch (err) {
    console.error("❌ Error Gmail signin:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
