import express from "express";
import bcrypt from "bcrypt";
import { supabase } from "../utils/supabaseClient.js";
import passport from '../middlewares/passport.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../utils/jwt.js";
import {
  addRefreshToken,
  hasRefreshToken,
  removeRefreshToken,
} from "../utils/token-store.js";

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
  // mode can be 'signup' or 'signin' (default signin)
  const mode = req.query.mode === 'signup' ? 'signup' : 'signin';
  // Store in session as a fallback, but also pass via OAuth state to survive redirects
  req.session.authMode = mode;
  // Start passport flow and include the mode in the OAuth state param so Google returns it
  passport.authenticate('google', { scope: ['profile', 'email'], state: mode })(req, res, next);
});

// Callback after Google OAuth
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  (req, res) => {
    // Read mode from returned state (fallback to session)
    const returnedState = req.query?.state;
    const mode = returnedState === 'signup' ? 'signup' : req.session.authMode || 'signin';
    req.session.authMode = mode;

    // Save profile in session and redirect to a continue page
    req.session.googleProfile = req.user;
    return res.redirect('/google/continue');
  }
);

// Continue page where user sets password (and role for signup)
router.get('/google/continue', (req, res) => {
  const profile = req.session.googleProfile;
  const mode = req.session.authMode || 'signin';
  if (!profile) return res.redirect('/signin');

  return res.render('vwAuth/google-continue', {
    layout: 'auth',
    title: mode === 'signup' ? 'Complete Signup' : 'Complete Sign In',
    mode,
    name: profile.name || profile.displayName || '',
    email: profile.email || profile.emails?.[0]?.value || '',
  });
});

// POST: complete signup using Google profile + provided password and role
router.post('/google/complete', async (req, res) => {
  try {
    const profile = req.session.googleProfile;
    const mode = req.session.authMode || 'signup';
    if (!profile) return res.status(400).json({ success: false, message: 'Missing Google profile' });

    const { password, confirmPassword, role } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (confirmPassword === undefined || password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const email = profile.email || profile.emails?.[0]?.value;
    const fullName = profile.name || profile.displayName || '';

    // Check existing
    const { data: existing } = await supabase.from('users').select('id,role').eq('email', email).maybeSingle();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists. Please sign in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertPayload = {
      full_name: fullName,
      email: email,
      password_hash: hashedPassword,
      role: role || 'student',
      google_id: profile.id || null,
    };

    console.log('Insert payload:', insertPayload); // Debugging line

    // Try inserting and request the inserted row back in the same call.
    // If the DB schema doesn't have google_id (PGRST204), retry without that field.
    let user = null;
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('users')
        .insert([insertPayload])
        .select('*')
        .single();
      if (insertErr) throw insertErr;
      user = inserted;
    } catch (err) {
      // If the error indicates missing google_id column in schema, retry without it
      if (err?.code === 'PGRST204' || (err?.message && err.message.includes('google_id'))) {
        const payloadNoGoogle = { ...insertPayload };
        delete payloadNoGoogle.google_id;
        const { data: inserted2, error: insertErr2 } = await supabase
          .from('users')
          .insert([payloadNoGoogle])
          .select('*')
          .single();
        if (insertErr2) throw insertErr2;
        user = inserted2;
      } else {
        throw err;
      }
    }

    if (!user) {
      console.error('Could not retrieve user after signup - insert returned no row');
      return res.status(500).json({ success: false, message: 'Could not retrieve user after signup' });
    }

    const payload = { id: user.id, role: user.role, name: user.full_name, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(user.id, refreshToken);

    // Set cookies
    res.cookie('access_token', accessToken, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', path: '/auth', maxAge: 7 * 24 * 60 * 60 * 1000 });

    // Ensure Passport session (req.user) reflects DB user so role is available for later checks
    try {
      if (typeof req.logIn === 'function') {
        await new Promise((resolve, reject) => {
          req.logIn(payload, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      } else {
        // fallback: directly set req.user and session.passport.user
        req.user = payload;
        req.session = req.session || {};
        req.session.passport = req.session.passport || {};
        req.session.passport.user = payload;
      }
    } catch (e) {
      console.error('Failed to attach user to passport session', e);
    }

    // Clear session helpers
    delete req.session.googleProfile;
    delete req.session.authMode;

    return res.json({
      success: true,
      message: 'Sign up successfully. Please sign in to continue.',
      redirect: '/signin'
    });
  } catch (err) {
    console.error('/google/complete error', err);
    return res.status(500).json({ success: false, message: 'Server error during Google signup' });
  }
});

// POST: signin with Google + password (find user by Google email and verify password)
router.post('/google/login', async (req, res) => {
  try {
    const profile = req.session.googleProfile;
    if (!profile) return res.status(400).json({ success: false, message: 'Missing Google profile' });

    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password required' });

    // Ensure email is extracted correctly
    const email = profile.email || profile.emails?.[0]?.value;
    if (!email) return res.status(400).json({ success: false, message: 'Email not found in Google profile' });

    // Query Supabase for user by email
    const { data: users, error } = await supabase.from('users').select('*').eq('email', email.trim());
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const user = users?.[0];
    if (!user) return res.status(400).json({ success: false, message: 'No account found. Please sign up first.' });

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Incorrect password' });

    // Generate tokens and set cookies
    const payload = { id: user.id, role: user.role, name: user.full_name, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    addRefreshToken(user.id, refreshToken);

    res.cookie('access_token', accessToken, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', path: '/auth', maxAge: 7 * 24 * 60 * 60 * 1000 });

    // Attach user to session
    req.user = payload;
    req.session.passport = req.session.passport || {};
    req.session.passport.user = payload;

    // Redirect based on role
    return res.json({ success: true, redirect: user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard' });
  } catch (err) {
    console.error('/google/login error', err);
    return res.status(500).json({ success: false, message: 'Server error during Google login' });
  }
});

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

// Apply ensureRole middleware to routes requiring role checks
router.get('/teacher/dashboard', ensureRole, (req, res) => {
  res.render('vwTeacher/dashboard', { layout: 'main', user: req.user });
});

router.get('/student/dashboard', ensureRole, (req, res) => {
  res.render('vwStudent/dashboard', { layout: 'main', user: req.user });
});

export default router;
