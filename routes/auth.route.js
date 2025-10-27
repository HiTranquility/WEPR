// routes/auth.route.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { signAccessToken } from '../utils/jwt.js';
import { getUserByEmail, createUser, updateUser } from '../models/user.model.js';

const router = express.Router();

router.get('/signin', function(req, res) {
    res.render('vwAuth/signin', {
        layout: 'auth',
        title: 'Đăng nhập'
    });
});

router.get('/signup', function(req, res) {
    res.render('vwAuth/signup', {
        layout: 'auth',
        title: 'Đăng ký tài khoản'
    });
});

router.post('/signout', function (req, res) {
    // req.session.isAuthenticated = false;
    // req.session.authUser = null;
    // // res.redirect('/signin');
    res.redirect(req.headers.referer);
});

router.get('/forgot', function(req, res) {
    res.render('vwAuth/forgot', {
        layout: 'auth',
        title: 'Quên mật khẩu'
    });
});

router.get('/reset', function(req, res) {
    const token = req.query.token || '';
    res.render('vwAuth/reset', {
        layout: 'auth',
        title: 'Đặt lại mật khẩu',
        token: token
    });
});

// Đăng nhập
router.post('/signin', async function(req, res) {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu email hoặc mật khẩu' });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email không tồn tại!' });
        }
        console.log(user);

        // const hashed = user.password_hash || user.password || '';
        // const ok = await bcrypt.compare(password, String(hashed));
        // if (!ok) {
        //     return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
        // }
        const token = signAccessToken({ id: user.id, role: user.role, full_name: user.full_name });
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });

        if (user.role === 'admin') return res.redirect('/admin/dashboard');
        if (user.role === 'teacher') return res.redirect('/teacher/dashboard');
        return res.redirect('/student/dashboard');
    } catch (e) {
        console.error('signin error', e);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ!' });
    }
});

// Đăng ký
router.post('/signup', async function(req, res) {
    try {
        const { fullName, email, password, role } = req.body || {};
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
        }

        const existed = await getUserByEmail(email);
        if (existed) {
            return res.status(409).json({ success: false, message: 'Email đã tồn tại!' });
        }

        // const password_hash = await bcrypt.hash(password, 10);
        const [created] = await createUser({
            full_name: fullName,
            email,
            password_hash,
            role: role || 'student',
            status: 'active',
        });
        console.log(created);
        const token = signAccessToken({ id: created.id, role: created.role, full_name: created.full_name });
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });

        if (created.role === 'admin') return res.redirect('/admin/dashboard');
        if (created.role === 'teacher') return res.redirect('/teacher/dashboard');
        return res.redirect('/student/dashboard');
    } catch (e) {
        console.error('signup error', e);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ!' });
    }
});

// Quên mật khẩu (demo)
router.post('/forgot', async function(req, res) {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: 'Thiếu email!' });
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Email không tồn tại!' });
    return res.json({ success: true, message: 'Đã gửi hướng dẫn đặt lại mật khẩu (demo).' });
});

// Đặt lại mật khẩu (demo)
router.post('/reset', async function(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Email không tồn tại!' });

    const password_hash = await bcrypt.hash(password, 10);
    await updateUser(user.id, { password_hash });
    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
});

// Đăng xuất
router.post('/signout', async function(req, res) {
    res.clearCookie('access_token');
    res.redirect('/');
});

// Xác thực OTP (demo)
router.post('/verify-otp', async function(req, res) {
    return res.json({ success: true, message: 'Xác thực OTP thành công (demo)!' });
});

export default router;