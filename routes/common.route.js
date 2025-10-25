import express from 'express';

const router = express.Router();

router.get('/', function (req, res) {
    const featuredCourses = [
        {
            id: 1,
            title: 'Complete Python Bootcamp 2024',
            short_description: 'Learn Python from scratch with hands-on projects',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            price: 1999000,
            discount_price: 499000,
            rating_avg: 4.6,
            rating_count: 4789,
            enrollment_count: 42567
        },
        {
            id: 2,
            title: 'The Complete JavaScript Course 2024',
            short_description: 'Master JavaScript with projects, challenges and theory',
            thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
            price: 1799000,
            discount_price: 399000,
            rating_avg: 4.7,
            rating_count: 5234,
            enrollment_count: 35890
        },
        {
            id: 3,
            title: 'React - The Complete Guide 2024',
            short_description: 'Learn React, Hooks, Redux, and more',
            thumbnail_url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
            price: 1899000,
            discount_price: 449000,
            rating_avg: 4.8,
            rating_count: 6123,
            enrollment_count: 45678
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
            view_count: 125000,
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Jose Portilla',
                avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
            }
        },
        {
            id: 2,
            title: 'The Complete JavaScript Course',
            thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
            rating_avg: 4.7,
            rating_count: 5234,
            price: 1799000,
            discount_price: 399000,
            enrollment_count: 35890,
            view_count: 98000,
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Jonas Schmedtmann',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
            }
        },
        {
            id: 3,
            title: 'React Complete Guide',
            thumbnail_url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
            rating_avg: 4.8,
            rating_count: 6123,
            price: 1899000,
            discount_price: 449000,
            enrollment_count: 45678,
            view_count: 112000,
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Maximilian Schwarzmüller',
                avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            }
        }
    ];

    const newestCourses = [
        {
            id: 4,
            title: 'Node.js Complete Course 2024',
            thumbnail_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
            rating_avg: 4.5,
            rating_count: 2345,
            price: 1699000,
            discount_price: 399000,
            enrollment_count: 12890,
            view_count: 34000,
            created_at: new Date('2024-03-15'),
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Andrew Mead',
                avatar_url: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg'
            }
        },
        {
            id: 5,
            title: 'Machine Learning A-Z',
            thumbnail_url: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg',
            rating_avg: 4.7,
            rating_count: 3456,
            price: 2199000,
            discount_price: 599000,
            enrollment_count: 18900,
            view_count: 45000,
            created_at: new Date('2024-03-10'),
            category: { name: 'Khoa học dữ liệu' },
            teacher: {
                full_name: 'Kirill Eremenko',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
            }
        }
    ];

    const topCategories = [
        { id: 1, name: 'Lập trình', enrollment_count: 1250, course_count: 245 },
        { id: 2, name: 'Kinh doanh', enrollment_count: 980, course_count: 189 },
        { id: 3, name: 'Thiết kế', enrollment_count: 856, course_count: 156 },
        { id: 4, name: 'Marketing', enrollment_count: 734, course_count: 134 },
        { id: 5, name: 'Khoa học dữ liệu', enrollment_count: 698, course_count: 98 },
        { id: 6, name: 'Phát triển cá nhân', enrollment_count: 567, course_count: 167 }
    ];

    const allCategories = [
        {
            id: 1, name: 'Lập trình', children: [
                { id: 11, name: 'Web Development' },
                { id: 12, name: 'Mobile Development' },
                { id: 13, name: 'Game Development' }
            ]
        },
        {
            id: 2, name: 'Kinh doanh', children: [
                { id: 21, name: 'Quản trị kinh doanh' },
                { id: 22, name: 'Khởi nghiệp' }
            ]
        },
        {
            id: 3, name: 'Thiết kế', children: [
                { id: 31, name: 'UI/UX Design' },
                { id: 32, name: 'Graphic Design' }
            ]
        }
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

router.post('/contact-us', function (req, res) {
    const { fullName, email, message } = req.body;
    const sentSuccessfully = fullName && email && message;
    res.render('vwCommon/contact-us', {
        title: 'Liên hệ',
        layout: 'main',
        sent: sentSuccessfully
    });
});

export default router;
