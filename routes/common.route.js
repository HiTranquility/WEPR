import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    const featuredCourses = [
        {
            id: 1,
            title: 'Complete Python Bootcamp 2024',
            short_description: 'Learn Python from scratch',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            price: 1999000,
            discount_price: 499000,
            rating_avg: 4.6,
            rating_count: 4789,
            enrollment_count: 42567
        }
    ];

    const mostViewedCourses = [
        {
            id: 1,
            title: 'Complete Python Bootcamp',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            rating_avg: 4.6,
            rating_count: 4789,
            price: 1999000,
            discount_price: 499000,
            enrollment_count: 42567,
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Jose Portilla',
                avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
            }
        }
    ];

    const newestCourses = [
        {
            id: 2,
            title: 'JavaScript Complete',
            thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
            rating_avg: 4.7,
            rating_count: 5234,
            price: 1799000,
            discount_price: 399000,
            enrollment_count: 35890,
            view_count: 98000,
            created_at: new Date(),
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Jonas Schmedtmann',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
            }
        }
    ];

    const topCategories = [
        { id: 1, name: 'Lập trình', enrollment_count: 1250, course_count: 245 },
        { id: 2, name: 'Kinh doanh', enrollment_count: 980, course_count: 189 }
    ];

    const allCategories = [
        { id: 1, name: 'Lập trình', children: [
            { id: 11, name: 'Web Development' }
        ]}
    ];

    res.render('vwCommon/landing', {
        featuredCourses,
        mostViewedCourses,
        newestCourses,
        topCategories,
        allCategories,
        title: 'Online Academy - Learn Anytime, Anywhere',
        layout: 'main'
    });
});

router.get('/403', (req, res) => {
    res.render('vwCommon/403', {
        layout: 'error',
        title: '403 - Access Denied',
        bodyClass: 'error-403'
    });
});

router.get('/404', (req, res) => {
    res.render('vwCommon/404', {
        layout: 'error',
        title: '404 - Page Not Found',
        bodyClass: 'error-404'
    });
});

router.get('/500', (req, res) => {
    res.render('vwCommon/500', {
        layout: 'error',
        title: '500 - Internal Server Error',
        bodyClass: 'error-500'
    });
});

router.get('/400', (req, res) => {
    res.render('vwCommon/400', {
        layout: 'error',
        title: '400 - Bad Request',
        bodyClass: 'error-400'
    });
});

router.get('/405', (req, res) => {
    res.render('vwCommon/405', {
        layout: 'error',
        title: '405 - Method Not Allowed',
        bodyClass: 'error-405'
    });
});

router.get('/about-us', (req, res) => {
    res.render('vwCommon/about-us', {
        title: 'Về chúng tôi',
        layout: 'main'
    });
});

router.get('/contact-us', (req, res) => {
    res.render('vwCommon/contact-us', {
        title: 'Liên hệ',
        layout: 'main'
    });
});

router.get('/privacy', (req, res) => {
    res.render('vwCommon/privacy', {
        title: 'Chính sách bảo mật',
        layout: 'main'
    });
});

router.get('/terms', (req, res) => {
    res.render('vwCommon/terms', {
        title: 'Điều khoản sử dụng',
        layout: 'main'
    });
});

router.post('/contact', (req, res) => {
    res.json({ success: true, message: 'Đã gửi tin nhắn thành công!' });
});

export default router;