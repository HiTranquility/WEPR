import express from 'express';

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

router.post('/signin', function(req, res) {
    res.json({ success: true, message: 'Đăng nhập thành công!' });
});

router.post('/signup', function(req, res) {
    res.json({ success: true, message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.' });
});

router.post('/forgot', function(req, res) {
    res.json({ success: true, message: 'Đã gửi link đặt lại mật khẩu đến email của bạn!' });
});

router.post('/reset', function(req, res) {
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
});

router.post('/signout', function(req, res) {
    res.json({ success: true, message: 'Đăng xuất thành công!' });
});

router.post('/verify-otp', function(req, res) {
    res.json({ success: true, message: 'Xác thực OTP thành công!' });
});

export default router;
