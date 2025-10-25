import express from 'express';
import { getAllCourses } from '../models/course.model.js';

const router = express.Router();

router.get('/courses', async function(req, res) {
    const courses = await getAllCourses();
    if (!courses) {
        res.status(404).render('vwCommon/404', { layout: 'error', title: '404 - Page Not Found', bodyClass: 'error-404' });
    }
    

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
            category: { id: 1, name: 'Lập trình' },
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
            category: { id: 1, name: 'Lập trình' },
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
            category: { id: 1, name: 'Lập trình' },
            teacher: {
                id: 3,
                full_name: 'Maximilian Schwarzmüller',
                avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            }
        },
        {
            id: 4,
            title: 'Node.js, Express & MongoDB: The Complete Bootcamp',
            short_description: 'Master Node by building a real-world RESTful API and web app',
            thumbnail_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
            price: 1699000,
            discount_price: 399000,
            rating_avg: 4.5,
            rating_count: 3421,
            enrollment_count: 28900,
            view_count: 76000,
            category: { id: 1, name: 'Lập trình' },
            teacher: {
                id: 4,
                full_name: 'Jonas Schmedtmann',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
            }
        },
        {
            id: 5,
            title: 'Machine Learning A-Z: AI, Python & R',
            short_description: 'Learn to create Machine Learning Algorithms in Python and R',
            thumbnail_url: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg',
            price: 2199000,
            discount_price: 599000,
            rating_avg: 4.5,
            rating_count: 7890,
            enrollment_count: 52341,
            view_count: 145000,
            category: { id: 2, name: 'Khoa học dữ liệu' },
            teacher: {
                id: 5,
                full_name: 'Kirill Eremenko',
                avatar_url: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg'
            }
        },
        {
            id: 6,
            title: 'The Complete Digital Marketing Course',
            short_description: '12 Courses in 1: SEO, Social Media Marketing, Email Marketing, and More!',
            thumbnail_url: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
            price: 1899000,
            discount_price: 399000,
            rating_avg: 4.5,
            rating_count: 3456,
            enrollment_count: 28900,
            view_count: 67000,
            category: { id: 3, name: 'Marketing' },
            teacher: {
                id: 6,
                full_name: 'Rob Percival',
                avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            }
        }
    ];

    const categories = [
        { id: 1, name: 'Lập trình', course_count: 245 },
        { id: 2, name: 'Kinh doanh', course_count: 189 },
        { id: 3, name: 'Thiết kế', course_count: 156 },
        { id: 4, name: 'Marketing', course_count: 134 },
        { id: 5, name: 'Khoa học dữ liệu', course_count: 98 },
        { id: 6, name: 'Phát triển cá nhân', course_count: 167 }
    ];

    res.render('vwCourse/list', {
        title: 'Danh sách khóa học',
        courses: mockCourses,
        categories: categories,
        currentCategory: req.query.category || null,
        currentPage: parseInt(req.query.page) || 1,
        totalPages: 10,
        sortBy: req.query.sort || 'popular',
        layout: 'main'
    });
});

router.get('/courses/:id', async function(req, res) {
    
    const course = await readCourse(req.params.id);
    if (!course) {
        res.status(404).render('vwCommon/404', { layout: 'error', title: '404 - Page Not Found', bodyClass: 'error-404' });
    }
    const mockCourse = {
        id: req.params.id,
        title: 'Complete Python Bootcamp: Go from zero to hero in Python 3',
        short_description: 'Learn Python like a Professional! Start from the basics and go all the way to creating your own applications and games!',
        full_description: '<h3>Khóa học này là gì?</h3><p>Đây là khóa học Python toàn diện nhất! Cho dù bạn chưa từng lập trình bao giờ, hay muốn nâng cao kỹ năng Python hiện có, hoặc muốn học các tính năng mới nhất của Python 3, khóa học này dành cho bạn!</p><h3>Bạn sẽ học được gì?</h3><ul><li>Làm chủ Python 3 từ cơ bản đến nâng cao</li><li>Xây dựng các ứng dụng thực tế</li><li>Hiểu về OOP, decorators, generators</li><li>Làm việc với databases</li></ul>',
        thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
        price: 1999000,
        discount_price: 499000,
        rating_avg: 4.6,
        rating_count: 4789,
        enrollment_count: 42567,
        view_count: 125000,
        total_lectures: 185,
        total_duration: '22 giờ',
        total_resources: 15,
        updated_at: new Date(),
        created_at: new Date('2024-01-15'),
        category: {
            id: 1,
            name: 'Lập trình'
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
                duration: '2 giờ 15 phút',
                lecture_count: 12,
                lectures: [
                    { id: 4, title: 'Variables and Data Types', duration: '12:30', is_preview: false },
                    { id: 5, title: 'Operators', duration: '10:45', is_preview: false },
                    { id: 6, title: 'Strings', duration: '15:20', is_preview: false }
                ]
            }
        ],
        what_you_will_learn: [
            'Làm chủ Python 3 từ cơ bản đến nâng cao',
            'Xây dựng các ứng dụng thực tế với Python',
            'Hiểu về Object-Oriented Programming',
            'Làm việc với files và databases',
            'Tạo game và ứng dụng GUI',
            'Sử dụng các thư viện phổ biến'
        ],
        requirements: [
            'Không cần kiến thức lập trình trước đó',
            'Máy tính Windows, Mac hoặc Linux',
            'Tinh thần học hỏi và kiên trì'
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
            category: { name: 'Lập trình' },
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
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Maximilian Schwarzmüller',
                avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
            }
        },
        {
            id: 4,
            title: 'Node.js Complete Bootcamp',
            thumbnail_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
            rating_avg: 4.5,
            rating_count: 3421,
            discount_price: 399000,
            enrollment_count: 28900,
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Jonas Schmedtmann',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
            }
        }
    ];

    const reviews = [
        {
            id: 1,
            rating: 5,
            content: 'Khóa học tuyệt vời! Giảng viên giải thích rất rõ ràng và dễ hiểu. Tôi đã học được rất nhiều điều từ khóa học này.',
            created_at: new Date('2024-03-15'),
            student: {
                full_name: 'Nguyễn Văn A',
                avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
            }
        },
        {
            id: 2,
            rating: 4,
            content: 'Nội dung khóa học rất chi tiết và đầy đủ. Tuy nhiên, một số phần hơi khó hiểu với người mới bắt đầu.',
            created_at: new Date('2024-03-10'),
            student: {
                full_name: 'Trần Thị B',
                avatar_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg'
            }
        },
        {
            id: 3,
            rating: 5,
            content: 'Đây là khóa học Python tốt nhất mà tôi từng tham gia. Rất đáng đồng tiền bát gạo!',
            created_at: new Date('2024-03-05'),
            student: {
                full_name: 'Lê Văn C',
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
        isInWatchlist: false,
        layout: 'main'
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
            short_description: 'Learn Python from scratch',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            rating_avg: 4.6,
            rating_count: 4789,
            discount_price: 499000,
            enrollment_count: 42567,
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Jose Portilla',
                avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
            }
        }
    ];

    res.render('vwCourse/list', {
        title: `Kết quả tìm kiếm: ${searchQuery}`,
        courses: mockResults,
        categories: [],
        searchQuery: searchQuery,
        currentPage: 1,
        totalPages: 1,
        sortBy: 'popular',
        layout: 'main'
    });
});

router.post('/courses/:id/enroll', function(req, res) {
    res.json({ success: true, message: 'Đã đăng ký khóa học thành công!' });
});

router.post('/courses/:id/wishlist', function(req, res) {
    res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích!' });
});

router.delete('/courses/:id/wishlist', function(req, res) {
    res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích!' });
});

router.post('/courses/:id/reviews', function(req, res) {
    res.json({ success: true, message: 'Đã gửi đánh giá thành công!' });
});

export default router;