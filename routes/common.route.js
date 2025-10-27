import express from 'express';
import { getLandingData } from "../models/course.model.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await getLandingData();

    res.render("vwCommon/landing", {
      ...data,
      title: "Online Academy - Learn Anytime, Anywhere",
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/about-us', function (req, res) {
    res.render('vwCommon/about-us', {
        title: 'Về chúng tôi',
        layout: 'main'
    });
});

router.get('/contact-us', function (req, res) {
    res.render('vwCommon/contact-us', {
        title: 'Liên hệ',
        layout: 'main'
    });
});

router.get('/privacy', function (req, res) {
    res.render('vwCommon/privacy', {
        title: 'Chính sách bảo mật',
        layout: 'main'
    });
});

router.get('/terms', function (req, res) {
    res.render('vwCommon/terms', {
        title: 'Điều khoản sử dụng',
        layout: 'main'
    });
});

router.get('/404', (req, res) => {
    res.status(404).render('vwCommon/404', { layout: 'error', title: '404 - Page Not Found', bodyClass: 'error-404' });
});
router.get('/500', (req, res) => {
    res.status(500).render('vwCommon/500', { layout: 'error', title: '500 - Internal Server Error', bodyClass: 'error-500' });
});
router.get('/403', (req, res) => {
    res.status(403).render('vwCommon/403', { layout: 'error', title: '403 - Access Denied', bodyClass: 'error-403' });
});
router.get('/400', (req, res) => {
    res.status(400).render('vwCommon/400', { layout: 'error', title: '400 - Bad Request', bodyClass: 'error-400' });
});

router.post('/contact', function (req, res) {
    res.json({ success: true, message: 'Đã gửi tin nhắn thành công! Chúng tôi sẽ liên hệ lại với bạn sớm.' });
});

export default router;
