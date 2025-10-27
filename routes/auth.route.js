import express from "express";
import bcrypt from "bcrypt";
import { supabase } from "../utils/supabaseClient.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  addRefreshToken,
  hasRefreshToken,
  removeRefreshToken,
} from "../utils/token-store.js";

const router = express.Router();

// ==== [GET] /signin ====
router.get("/signin", (req, res) => {
  res.render("vwAuth/signin", { layout: "auth", title: "Đăng nhập" });
});

// ==== [GET] /signup ====
router.get("/signup", (req, res) => {
  res.render("vwAuth/signup", { layout: "auth", title: "Tạo tài khoản" });
});

// ==== [POST] /signup ====
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    // 1️⃣ Kiểm tra tài khoản có tồn tại chưa
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // 2️⃣ Mã hoá mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Thêm user mới vào Supabase
    const { error: insertError } = await supabase.from("users").insert([
      {
        full_name: fullName,
        email: email,
        password_hash: hashedPassword,
        role: role || "student",
      },
    ]);

    if (insertError) throw insertError;

    console.log("✅ User created:", email);
    return res.json({
      success: true,
      message: "Tạo tài khoản thành công!",
      redirect:
        role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
    });
  } catch (err) {
    console.error("/signup error", err);
    return res.status(500).json({ message: "Lỗi tạo tài khoản" });
  }
});

// ==== [POST] /signin ====
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Tìm user trong Supabase
    console.log("🔍 Searching for user with email:", email);
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim());  // exact match sau khi trim

    if (error) {
      console.error("❌ Supabase error:", error);
    }

    // Log số lượng users tìm được
    console.log("📊 Found users:", users?.length || 0);
    if (users?.length > 0) {
      console.log("👤 First user:", users[0].email);
    }

    const user = users?.[0];
    if (!user) {
      return res.render("vwAuth/signin", {
        layout: "auth",
        title: "Đăng nhập",
        error: "Tài khoản không tồn tại!",
      });
    }

    // 2️⃣ Kiểm tra mật khẩu
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.render("vwAuth/signin", {
        layout: "auth",
        title: "Đăng nhập",
        error: "Sai mật khẩu!",
      });
    }

    // 3️⃣ Sinh token
    const payload = {
      id: user.id,
      role: user.role,
      name: user.full_name,
      email: user.email,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(user.id, refreshToken);

    // 4️⃣ Lưu cookie
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 5️⃣ Điều hướng
    const redirectByRole = {
      admin: "/admin/dashboard",
      teacher: "/teacher/dashboard",
      student: "/student/dashboard",
    };
    return res.redirect(redirectByRole[user.role] || "/");
  } catch (err) {
    console.error("/signin error", err);
    return res.render("vwAuth/signin", {
      layout: "auth",
      title: "Đăng nhập",
      error: "Lỗi máy chủ!",
    });
  }
});

// ==== [POST] /auth/signout ====
router.post("/signout", (req, res) => {
    console.log("🔥 /auth/signout route HIT");
  const refresh = req.cookies?.refresh_token;
  try {
    const payload = verifyRefreshToken(refresh);
    removeRefreshToken(payload.id, refresh);
  } catch (err) {
    console.log("⚠️ refresh token verify failed:", err.message);
  }

  // ✅ Xóa cookie ở cả 2 path cho chắc
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/auth" });

  console.log("✅ Signed out successfully, clearing cookies.");
  return res.redirect("/signin");
});

export default router;
