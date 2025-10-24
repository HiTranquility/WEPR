import express from 'express';

const router = express.Router();

router.get('/courses', function(req, res) {
    const mockCourses = [
        {
            id: 1,
            title: 'Complete Python Bootcamp: Go from zero to hero in Python 3',
            short_description: 'Learn Python like a Professional! Start from the basics and go all the way to creating your own applications and games!',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            price: 1999000,
            discount_price: 499000,
            rating_avg: 4.6,
            rating_count: 4789,
            enrollment_count: 42567,
            view_count: 125000,
            category: { id: 1, name: 'L­p trình' },
            teacher: {
                id: 1,
                full_name: 'Jose Portilla',
                avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
            }
        },
        {
            id: 2,
            title: 'The Complete JavaScript Course 2024: From Zero to Expert!',
            short_description: 'The modern JavaScript course for everyone! Master JavaScript with projects, challenges and theory.',
            thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
            price: 1799000,
            discount_price: 399000,
            rating_avg: 4.7,
            rating_count: 5234,
            enrollment_count: 35890,
            view_count: 98000,
            category: { id: 1, name: 'L­p trình' },
            teacher: {
                id: 2,
                full_name: 'Jonas Schmedtmann',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
            }
        },
        {
            id: 3,
            title: 'React - The Complete Guide 2024',
            short_description: 'Dive in and learn React.js from scratch! Learn React, Hooks, Redux, React Router, Next.js, Best Practices and more!',
            thumbnail_url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
            price: 1899000,
            discount_price: 449000,
            rating_avg: 4.8,
            rating_count: 6123,
            enrollment_count: 45678,
            view_count: 112000,
            category: { id: 1, name: 'L­p trình' },
            teacher: {
                id: 3,
                full_name: 'Maximilian Schwarzmüller',
                avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            }
        }
    ];

    const categories = [
        { id: 1, name: 'L­p trình', course_count: 245 },
        { id: 2, name: 'Kinh doanh', course_count: 189 },
        { id: 3, name: 'Thi¿t k¿', course_count: 156 },
        { id: 4, name: 'Marketing', course_count: 134 },
        { id: 5, name: 'Khoa hÍc dï liÇu', course_count: 98 }
    ];

    res.render('vwCourse/list', {
        title: 'Danh sách khóa hÍc',
        courses: mockCourses,
        categories: categories,
        currentCategory: req.query.category || null,
        currentPage: parseInt(req.query.page) || 1,
        totalPages: 10,
        sortBy: req.query.sort || 'popular'
    });
});

router.get('/courses/:id', function(req, res) {
    const mockCourse = {
        id: req.params.id,
        title: 'Complete Python Bootcamp: Go from zero to hero in Python 3',
        short_description: 'Learn Python like a Professional! Start from the basics and go all the way to creating your own applications and games!',
        full_description: '<h3>Khóa hÍc này là gì?</h3><p>ây là khóa hÍc Python toàn diÇn nh¥t! Cho dù b¡n ch°a tëng l­p trình bao giÝ, hay muÑn nâng cao kù nng Python hiÇn có, ho·c muÑn hÍc các tính nng mÛi nh¥t cça Python 3, khóa hÍc này dành cho b¡n!</p><h3>B¡n s½ hÍc °ãc gì?</h3><ul><li>Làm chç Python 3 të c¡ b£n ¿n nâng cao</li><li>Xây dñng các éng dång thñc t¿</li><li>HiÃu vÁ OOP, decorators, generators</li><li>Làm viÇc vÛi databases</li></ul>',
        thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
        price: 1999000,
        discount_price: 499000,
        rating_avg: 4.6,
        rating_count: 4789,
        enrollment_count: 42567,
        view_count: 125000,
        total_lectures: 185,
        total_duration: '22 giÝ',
        total_resources: 15,
        updated_at: new Date(),
        created_at: new Date('2024-01-15'),
        category: {
            id: 1,
            name: 'L­p trình'
        },
        teacher: {
            id: 1,
            full_name: 'Jose Portilla',
            avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
            bio: 'Head of Data Science at Pierian Data Inc. Experienced instructor with over 1 million students worldwide.',
            rating_avg: 4.7,
            total_students: 1250000,
            total_courses: 25
        },
        sections: [
            {
                id: 1,
                title: 'Course Introduction',
                duration: '30 phút',
                lecture_count: 3,
                lectures: [
                    { id: 1, title: 'Introduction to Course', duration: '10:30', is_preview: true },
                    { id: 2, title: 'Course Curriculum Overview', duration: '15:45', is_preview: true },
                    { id: 3, title: 'Setting up Environment', duration: '20:15', is_preview: false }
                ]
            },
            {
                id: 2,
                title: 'Python Basics',
                duration: '2 giÝ 15 phút',
                lecture_count: 12,
                lectures: [
                    { id: 4, title: 'Variables and Data Types', duration: '12:30', is_preview: false },
                    { id: 5, title: 'Operators', duration: '10:45', is_preview: false }
                ]
            }
        ],
        what_you_will_learn: [
            'Làm chç Python 3 të c¡ b£n ¿n nâng cao',
            'Xây dñng các éng dång thñc t¿ vÛi Python',
            'HiÃu vÁ Object-Oriented Programming',
            'Làm viÇc vÛi files và databases'
        ],
        requirements: [
            'Không c§n ki¿n théc l­p trình tr°Ûc ó',
            'Máy tính Windows, Mac ho·c Linux',
            'Tinh th§n hÍc hÏi và kiên trì'
        ]
    };

    const relatedCourses = [
        {
            id: 2,
            title: 'The Complete JavaScript Course 2024',
            thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
            rating_avg: 4.7,
            rating_count: 5234,
            discount_price: 399000,
            enrollment_count: 35890,
            category: { name: 'L­p trình' },
            teacher: {
                full_name: 'Jonas Schmedtmann',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
            }
        },
        {
            id: 3,
            title: 'React - The Complete Guide 2024',
            thumbnail_url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
            rating_avg: 4.8,
            rating_count: 6123,
            discount_price: 449000,
            enrollment_count: 45678,
            category: { name: 'L­p trình' },
            teacher: {
                full_name: 'Maximilian Schwarzmüller',
                avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            }
        }
    ];

    const reviews = [
        {
            id: 1,
            rating: 5,
            content: 'Khóa hÍc tuyÇt vÝi! Gi£ng viên gi£i thích r¥t rõ ràng và dÅ hiÃu. Tôi ã hÍc °ãc r¥t nhiÁu iÁu të khóa hÍc này.',
            created_at: new Date('2024-03-15'),
            student: {
                full_name: 'NguyÅn Vn A',
                avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
            }
        },
        {
            id: 2,
            rating: 4,
            content: 'NÙi dung khóa hÍc r¥t chi ti¿t và §y ç. Tuy nhiên, mÙt sÑ ph§n h¡i khó hiÃu vÛi ng°Ýi mÛi b¯t §u.',
            created_at: new Date('2024-03-10'),
            student: {
                full_name: 'Tr§n ThË B',
                avatar_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg'
            }
        },
        {
            id: 3,
            rating: 5,
            content: 'ây là khóa hÍc Python tÑt nh¥t mà tôi tëng tham gia. R¥t áng Óng tiÁn bát g¡o!',
            created_at: new Date('2024-03-05'),
            student: {
                full_name: 'Lê Vn C',
                avatar_url: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg'
            }
        }
    ];

    res.render('vwCourse/detail', {
        title: mockCourse.title,
        course: mockCourse,
        relatedCourses: relatedCourses,
        reviews: reviews,
        isEnrolled: false,
        isInWatchlist: false
    });
});

router.get('/courses/:id/preview/:lectureId', function(req, res) {
    const mockLecture = {
        id: req.params.lectureId,
        title: 'Introduction to Course',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        description: 'Welcome to the course! In this lecture, we will introduce you to the course content.',
        duration: '10:30'
    };

    const mockCourse = {
        id: req.params.id,
        title: 'Complete Python Bootcamp',
        teacher: {
            full_name: 'Jose Portilla',
            avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
        }
    };

    res.render('vwCourse/preview', {
        layout: false,
        title: 'Preview Lecture',
        lecture: mockLecture,
        course: mockCourse
    });
});

router.get('/search', function(req, res) {
    const searchQuery = req.query.q || '';
    const mockResults = [
        {
            id: 1,
            title: 'Complete Python Bootcamp',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            rating_avg: 4.6,
            rating_count: 4789,
            discount_price: 499000,
            enrollment_count: 42567,
            category: { name: 'L­p trình' },
            teacher: { full_name: 'Jose Portilla' }
        }
    ];

    res.render('vwCourse/list', {
        title: `K¿t qu£ tìm ki¿m: ${searchQuery}`,
        courses: mockResults,
        searchQuery: searchQuery,
        currentPage: 1,
        totalPages: 1
    });
});

router.post('/courses/:id/enroll', function(req, res) {
    res.json({ success: true, message: 'ã ng ký khóa hÍc thành công!' });
});

router.post('/courses/:id/watchlist', function(req, res) {
    res.json({ success: true, message: 'ã thêm vào danh sách yêu thích!' });
});

router.delete('/courses/:id/watchlist', function(req, res) {
    res.json({ success: true, message: 'ã xóa khÏi danh sách yêu thích!' });
});

router.post('/courses/:id/reviews', function(req, res) {
    res.json({ success: true, message: 'ã gíi ánh giá thành công!' });
});

export default router;
