import express from "express";
import bcrypt from "bcrypt";
import passport from '../utils/passport.js';
import { findOrCreateGoogleUser, buildAuthPayload, getDashboardRedirectByRole, registerLocalUser, getUserByEmail, updateUser } from "../models/user.model.js";
import { authenticateAdmin, buildAdminAuthPayload } from "../models/admin.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../utils/jwt.js";
import {
  addRefreshToken,
  removeRefreshToken,
  clearRefreshTokens,
} from "../utils/token-store.js";
import { sendPasswordResetEmail } from "../utils/emailOtp.js";
import { createPasswordResetToken, getPasswordResetToken, consumePasswordResetToken } from "../utils/password-reset-store.js";

// Import new middlewares
import { ensureAuthenticated as ensureTeacher, requireRole as requireTeacherRole } from '../middlewares/teacher.middleware.js';
import { ensureAuthenticated as ensureStudent, requireRole as requireStudentRole } from '../middlewares/student.middleware.js';

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
  if (req.user) {
    return res.redirect('/');
  }
  res.render("vwAuth/signin", { layout: "auth", title: "Đăng nhập" });
});

// ==== [GET] /signup ====
router.get("/signup", (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
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

// ==== [GET] /forgot ====
router.get(["/forgot", "/auth/forgot"], (req, res) => {
  res.render("vwAuth/forgot", { layout: "auth", title: "Quên mật khẩu" });
});

// ==== [POST] /forgot ====
router.post(["/forgot", "/auth/forgot"], async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email hợp lệ" });
    }

    const user = await getUserByEmail(email);
    const successMessage = "Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.";

    if (!user) {
      return res.json({ success: true, message: successMessage });
    }

    const token = createPasswordResetToken(user.id);
    const resetLink = `${req.protocol}://${req.get("host")}/auth/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink, user.full_name);
    } catch (emailErr) {
      console.error("sendPasswordResetEmail error:", emailErr);
      return res.status(500).json({ message: emailErr.message || "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau." });
    }

    return res.json({ success: true, message: successMessage });
  } catch (err) {
    console.error("/forgot error", err);
    return res.status(500).json({ message: "Lỗi máy chủ. Vui lòng thử lại sau." });
  }
});

// ==== [GET] /reset-password ====
router.get(["/reset-password", "/auth/reset-password"], (req, res) => {
  const queryToken = typeof req.query?.token === "string" ? req.query.token.trim() : "";

  let activeToken = queryToken;
  if (!activeToken && req.session?.passwordReset?.token) {
    activeToken = req.session.passwordReset.token;
  }

  if (!activeToken) {
    return res.redirect("/forgot");
  }

  const record = getPasswordResetToken(activeToken);
  if (!record) {
    if (req.session?.passwordReset) {
      delete req.session.passwordReset;
    }
    return res.render("vwAuth/reset", {
      layout: "auth",
      title: "Đặt lại mật khẩu",
      tokenInvalid: true,
    });
  }

  req.session.passwordReset = { token: activeToken };

  return res.render("vwAuth/reset", {
    layout: "auth",
    title: "Đặt lại mật khẩu",
    tokenInvalid: false,
  });
});

// ==== [POST] /reset-password ====
router.post(["/reset-password", "/auth/reset-password"], async (req, res) => {
  try {
    const password = req.body?.password;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const token = req.session?.passwordReset?.token;
    if (!token) {
      return res.status(400).json({ message: "Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
    }

    const record = consumePasswordResetToken(token);
    if (!record) {
      if (req.session?.passwordReset) {
        delete req.session.passwordReset;
      }
      return res.status(400).json({ message: "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng thử lại." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await updateUser(record.userId, { password_hash: hashed, updated_at: new Date() });
    clearRefreshTokens(record.userId);

    if (req.session?.passwordReset) {
      delete req.session.passwordReset;
    }

    return res.json({ success: true, message: "Cập nhật mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ." });
  } catch (err) {
    console.error("/reset-password error", err);
    return res.status(500).json({ message: "Lỗi máy chủ. Vui lòng thử lại sau." });
  }
});

// New: Use role middleware for teacher and student dashboard
router.get('/teacher/dashboard', ensureTeacher, requireTeacherRole('teacher'), (req, res) => {
  res.render('vwTeacher/dashboard', { layout: 'main', user: req.user });
});

router.get('/student/dashboard', ensureStudent, requireStudentRole('student'), (req, res) => {
  res.render('vwStudent/dashboard', { layout: 'main', user: req.user });
});

router.get('/admin/login', function(req, res) {
  if (req.user && req.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.render('vwAuth/admin-signin', {
    title: 'Admin Login',
    layout: false,
    error: req.query.error
  });
});

router.post('/admin/login', async function(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.redirect('/admin/login?error=Vui lòng nhập đầy đủ thông tin');
    }

    const authResult = await authenticateAdmin({ email, password });

    if (!authResult.ok) {
      const messageMap = {
        NOT_FOUND: 'Email không tồn tại',
        FORBIDDEN: 'Bạn không có quyền truy cập',
        BLOCKED: 'Tài khoản đã bị khóa',
        INVALID_PASSWORD: 'Mật khẩu không đúng',
        MISSING_CREDENTIALS: 'Vui lòng nhập đầy đủ thông tin',
      };
      const errorMessage = messageMap[authResult.code] || 'Có lỗi xảy ra';
      return res.redirect(`/admin/login?error=${encodeURIComponent(errorMessage)}`);
    }

    const admin = authResult.admin;
    const payload = buildAdminAuthPayload(admin) || buildAuthPayload(admin);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await addRefreshToken(admin.id, refreshToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Admin login error:', err);
    res.redirect('/admin/login?error=Có lỗi xảy ra');
  }
});

export default router;
