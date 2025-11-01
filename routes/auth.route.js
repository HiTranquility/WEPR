import express from "express";
import bcrypt from "bcrypt";
import passport from '../utils/passport.js';
import { findOrCreateGoogleUser, buildAuthPayload, getDashboardRedirectByRole, registerLocalUser, getUserByEmail } from "../models/user.model.js";
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

    const user = await getUserByEmail(email);

    if (!user) {
      return res.redirect('/admin/login?error=Email không tồn tại');
    }

    if (user.role !== 'admin') {
      return res.redirect('/admin/login?error=Bạn không có quyền truy cập');
    }

    if (user.status === 'blocked') {
      return res.redirect('/admin/login?error=Tài khoản đã bị khóa');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.redirect('/admin/login?error=Mật khẩu không đúng');
    }

    const payload = buildAuthPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await addRefreshToken(user.id, refreshToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Admin login error:', err);
    res.redirect('/admin/login?error=Có lỗi xảy ra');
  }
});

export default router;
