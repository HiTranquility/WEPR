import express from "express";
import bcrypt from "bcrypt";
import passport from '../utils/passport.js';
import { findOrCreateGoogleUser, buildAuthPayload, getDashboardRedirectByRole, registerLocalUser, getUserByEmail, updatePasswordByEmail, requestPasswordReset, verifyPasswordResetOtp, resetPasswordWithOtp } from "../models/user.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../utils/jwt.js";
import {
  addRefreshToken,
  removeRefreshToken,
} from "../utils/token-store.js";

// Import new middlewares
import { ensureAuthenticated as ensureTeacher, requireRole as requireTeacherRole } from '../middlewares/teacher.middleware.js';
import { ensureAuthenticated as ensureStudent, requireRole as requireStudentRole } from '../middlewares/student.middleware.js';
import { hasActiveOtp } from '../utils/otp.js';

const router = express.Router();

// Middleware to ensure role is always available
function ensureRole(req, res, next) {
  if (!req.user || !req.user.role) {
    try {
      const token = req.cookies.access_token;
      if (token) {
        const payload = verifyAccessToken(token);
        if (payload && payload.role) {
          req.user = req.user || {};
          req.user.role = payload.role;
        }
      }
    } catch (err) {
      console.error('Failed to decode access_token:', err);
    }
  }

  if (!req.user || !req.user.role) {
    return res.status(403).send('Access denied. Role is required.');
  }

  next();
}

// Google OAuth2 entry point: support mode=signup or mode=signin
router.get('/google', (req, res, next) => {
  const mode = req.query.mode === 'signup' ? 'signup' : 'signin';
  const role = (req.query.role === 'teacher' || req.query.role === 'admin') ? req.query.role : 'student';
  // Save desired role for new accounts
  req.session.authMode = mode;
  req.session.googleDesiredRole = role;
  // Encode both into state so it survives redirects
  const state = JSON.stringify({ mode, role });
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

// Callback after Google OAuth
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  async (req, res) => {
    try {
      const profile = req.user;
      const email = profile?.email || profile?.emails?.[0]?.value;
      const fullName = profile?.name || profile?.displayName || '';
      if (!email) return res.redirect('/signin');
      // Read desired role (only used when creating new accounts)
      let desiredRole = 'student';
      try {
        if (req.query?.state) {
          const parsed = JSON.parse(req.query.state);
          if (parsed?.role) desiredRole = parsed.role;
        } else if (req.session.googleDesiredRole) {
          desiredRole = req.session.googleDesiredRole;
        }
      } catch (_) {}

      // Find or create user (default role = student)
      const user = await findOrCreateGoogleUser({
        email,
        fullName,
        googleId: profile.id,
        defaultRole: desiredRole,
      });

      if (!user) return res.redirect('/signin');

      const payload = buildAuthPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(user.id, refreshToken);

    res.cookie('access_token', accessToken, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });

      // Attach to session for SSR routes expecting req.user
      try {
        req.user = payload;
        req.session = req.session || {};
        req.session.passport = req.session.passport || {};
        req.session.passport.user = payload;
      } catch (_) {}

      return res.redirect(getDashboardRedirectByRole(user.role));
  } catch (err) {
      return res.redirect('/signin');
    }
  }
);

// Removed google continue + post steps; handled entirely in callback

// ==== [GET] /signin ====
router.get("/signin", (req, res) => {
  res.render("vwAuth/signin", { layout: "auth", title: "Đăng nhập" });
});

// ==== [GET] /forgot ====
router.get("/forgot", (req, res) => {
  res.render("vwAuth/forgot", { layout: "auth", title: "Quên mật khẩu" });
});

// ==== [GET] /reset ====
router.get("/reset", (req, res) => {
  const { email } = req.query;
  res.render("vwAuth/reset", { layout: "auth", title: "Đặt lại mật khẩu", email });
});

// ==== [GET] /signup ====
router.get("/signup", (req, res) => {
  res.render("vwAuth/signup", { layout: "auth", title: "Tạo tài khoản" });
});

// ==== [POST] /signup ====
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    const user = await registerLocalUser({ fullName, email, password, role });

    if (!user) {
      return res.status(500).json({ message: "Không thể tạo tài khoản" });
    }

    console.log("✅ User created:", email);
    return res.json({
      success: true,
      message: "Tạo tài khoản thành công!",
      redirect: (role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"),
    });
  } catch (err) {
    if (err?.code === "EMAIL_EXISTS") {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }
    if (err?.code === "VALIDATION_ERROR") {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }
    console.error("/signup error", err);
    return res.status(500).json({ message: "Lỗi tạo tài khoản" });
  }
});

// ==== [POST] /send-otp ====
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Missing email" });
    const ok = await requestPasswordReset(String(email).trim());
    if (!ok) {
      const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
      if (!wantsJson) {
        return res.status(404).render("vwAuth/forgot", { layout: "auth", title: "Quên mật khẩu", error: "Email không tồn tại" });
      }
      return res.status(404).json({ success: false, message: "Email không tồn tại" });
    }
    const user = await getUserByEmail(String(email).trim());
    const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
    if (!wantsJson) {
      return res.redirect(`/reset?email=${encodeURIComponent(user.email)}`);
    }
    return res.json({ success: true, message: "OTP đã được gửi email", email: user?.email || email });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
    if (!wantsJson) {
      return res.status(500).render("vwAuth/forgot", { layout: "auth", title: "Quên mật khẩu", error: "Gửi OTP thất bại" });
    }
    return res.status(500).json({ success: false, message: "Gửi OTP thất bại" });
  }
});

// ==== [POST] /verify-otp ====
router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Thiếu email hoặc otp" });
    const ok = verifyOtp(String(email).trim(), otp);
    if (!ok) return res.status(400).json({ success: false, message: "OTP không hợp lệ hoặc đã hết hạn" });
    return res.json({ success: true, message: "OTP hợp lệ" });
  } catch (err) {
    console.error("🔥 Error verifying OTP:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// ==== [POST] /reset ====
router.post("/reset", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
      if (!wantsJson) {
        return res.status(400).render("vwAuth/reset", { layout: "auth", title: "Đặt lại mật khẩu", email, error: "Thiếu dữ liệu" });
      }
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    }
    const verified = await verifyPasswordResetOtp(String(email).trim(), otp);
    if (!verified) {
      const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
      if (!wantsJson) {
        return res.status(400).render("vwAuth/reset", { layout: "auth", title: "Đặt lại mật khẩu", email, error: "OTP không hợp lệ hoặc đã hết hạn" });
      }
      return res.status(400).json({ success: false, message: "OTP không hợp lệ hoặc đã hết hạn" });
    }
    const user = await getUserByEmail(String(email).trim());
    if (!user) {
      const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
      if (!wantsJson) {
        return res.status(404).render("vwAuth/reset", { layout: "auth", title: "Đặt lại mật khẩu", email, error: "Email không tồn tại" });
      }
      return res.status(404).json({ success: false, message: "Email không tồn tại" });
    }
    const changed = await resetPasswordWithOtp(user.email, otp, password);
    if (!changed) {
      const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
      if (!wantsJson) {
        return res.status(400).render("vwAuth/reset", { layout: "auth", title: "Đặt lại mật khẩu", email, error: "Không thể cập nhật mật khẩu" });
      }
      return res.status(400).json({ success: false, message: "Không thể cập nhật mật khẩu" });
    }
    const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
    if (!wantsJson) {
      return res.redirect('/signin');
    }
    return res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
    if (!wantsJson) {
      const { email } = req.body || {};
      return res.status(500).render("vwAuth/reset", { layout: "auth", title: "Đặt lại mật khẩu", email, error: "Đặt lại mật khẩu thất bại" });
    }
    return res.status(500).json({ success: false, message: "Đặt lại mật khẩu thất bại" });
  }
});

// ==== [POST] /signin ====
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail((email || '').trim());

    if (!user) {
      return res.render("vwAuth/signin", {
        layout: "auth",
        title: "Đăng nhập",
        error: "Tài khoản không tồn tại!",
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.render("vwAuth/signin", {
        layout: "auth",
        title: "Đăng nhập",
        error: "Sai mật khẩu!",
      });
    }

    const payload = buildAuthPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(user.id, refreshToken);

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
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(getDashboardRedirectByRole(user.role));
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
  res.clearCookie("refresh_token", { path: "/" });

  console.log("✅ Signed out successfully, clearing cookies.");
  return res.redirect("/signin");
});

// New: Use role middleware for teacher and student dashboard
router.get('/teacher/dashboard', ensureTeacher, requireTeacherRole('teacher'), (req, res) => {
  res.render('vwTeacher/dashboard', { layout: 'main', user: req.user });
});

router.get('/student/dashboard', ensureStudent, requireStudentRole('student'), (req, res) => {
  res.render('vwStudent/dashboard', { layout: 'main', user: req.user });
});

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

export default router;
