import express from 'express';
import { hbsHelpers } from '../utils/hbsHelpers.js';


const router = express.Router();

router.get('/teacher/dashboard', function (req, res) {
    const stats = {
        total_courses: 8,
        published_courses: 5,
        draft_courses: 2,
        total_students: 12500,
        total_revenue: 450000000,
        avg_rating: 4.6
    };
    res.render('vwTeacher/dashboard', {
        title: 'Trang chủ giảng viên',
        user: {
            full_name: 'Nguyễn Văn A',
            email: 'student@example.com',
            avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
        },
        statsList: [
            { value: stats.total_courses, label: 'Total courses' },
            { value: stats.published_courses, label: 'Published courses' },
            { value: stats.draft_courses, label: 'Draft courses' },
            { value: hbsHelpers.formatNumber(stats.total_students), label: 'Total students' },
            { value: hbsHelpers.formatCurrency(stats.total_revenue), label: 'Total revenue' },
            { value: stats.avg_rating, label: 'Average rating' },
        ],
        recentCourses: [
            {
                id: 1,
                title: 'Complete Python Bootcamp',
                thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
                status: 'published',
                enrollment_count: 4256,
                rating_avg: 4.6,
                revenue: 210000000
            }
        ]
    });
});

router.get('/teacher/courses', function (req, res) {
    res.render('vwTeacher/course-list', {
        title: 'Khóa học của tôi - Giảng viên',
        courses: [
            {
                id: 1,
                title: 'Complete Python Bootcamp: Go from zero to hero',
                thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
                status: 'published',
                enrollment_count: 42567,
                rating_avg: 4.6,
                view_count: 125000,
                discount_price: 499000,
                updated_at: new Date(),
                category: { name: 'Lập trình' }
            },
            {
                id: 2,
                title: 'Advanced Python Programming',
                thumbnail_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
                status: 'draft',
                enrollment_count: 0,
                rating_avg: 0,
                view_count: 0,
                discount_price: 599000,
                updated_at: new Date(),
                category: { name: 'Lập trình' }
            },
            {
                id: 3,
                title: 'Python for Data Science',
                thumbnail_url: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg',
                status: 'incomplete',
                enrollment_count: 0,
                rating_avg: 0,
                view_count: 0,
                discount_price: 699000,
                updated_at: new Date(),
                category: { name: 'Khoa học dữ liệu' }
            }
        ]
    });
});

router.get('/teacher/create-course', function (req, res) {
    res.render('vwTeacher/create-course', {
        title: 'Tạo khóa học mới',
        categories: [
            { id: 1, name: 'Lập trình' },
            { id: 2, name: 'Kinh doanh' },
            { id: 3, name: 'Thiết kế' },
            { id: 4, name: 'Marketing' },
            { id: 5, name: 'Khoa học dữ liệu' },
            { id: 6, name: 'Phát triển cá nhân' }
        ]
    });
});

router.get('/teacher/edit-course/:id', function (req, res) {
    res.render('vwTeacher/create-course', {
        title: 'Chỉnh sửa khóa học',
        isEdit: true,
        course: {
            id: req.params.id,
            title: 'Complete Python Bootcamp',
            short_description: 'Learn Python from scratch',
            full_description: '<h3>About this course</h3><p>Complete Python course</p>',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            price: 1999000,
            discount_price: 499000,
            status: 'published',
            category_id: 1
        },
        categories: [
            { id: 1, name: 'Lập trình' },
            { id: 2, name: 'Kinh doanh' },
            { id: 3, name: 'Thiết kế' }
        ]
    });
});

router.get('/teacher/course/:id', function (req, res) {
    res.render('vwTeacher/course-detail', {
        title: 'Chi tiết khóa học',
        course: {
            id: req.params.id,
            title: 'Complete Python Bootcamp',
            status: 'published',
            enrollment_count: 4256,
            rating_avg: 4.6,
            revenue: 210000000
        }
    });
});

router.get('/teacher/course/:id/manage', function (req, res) {
    res.render('vwTeacher/manage-course', {
        title: 'Quản lý khóa học',
        course: {
            id: req.params.id,
            title: 'Complete Python Bootcamp',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg'
        }
    });
});

router.get('/teacher/course/:id/content', function (req, res) {
    res.render('vwTeacher/manage-content', {
        title: 'Quản lý nội dung',
        course: {
            id: req.params.id,
            title: 'Complete Python Bootcamp',
            sections: [
                {
                    id: 1,
                    title: 'Introduction',
                    lectures: [
                        { id: 1, title: 'Welcome', duration: '10:30' }
                    ]
                }
            ]
        }
    });
});

router.get('/teacher/course/:courseId/section/:sectionId/lecture/create', function (req, res) {
    res.render('vwTeacher/create-lecture', {
        title: 'Tạo bài giảng mới',
        courseId: req.params.courseId,
        sectionId: req.params.sectionId
    });
});

router.get('/teacher/course/:courseId/section/create', function (req, res) {
    res.render('vwTeacher/create-section', {
        title: 'Tạo chương mới',
        courseId: req.params.courseId
    });
});

router.get('/teacher/course/:courseId/content/:contentId/edit', function (req, res) {
    res.render('vwTeacher/edit-content', {
        title: 'Chỉnh sửa nội dung',
        courseId: req.params.courseId,
        content: {
            id: req.params.contentId,
            title: 'Introduction to Course',
            video_url: '',
            description: ''
        }
    });
});

router.get('/teacher/course/:id/edit', function (req, res) {
    res.render('vwTeacher/edit-course', {
        title: 'Chỉnh sửa khóa học',
        course: {
            id: req.params.id,
            title: 'Complete Python Bootcamp',
            short_description: 'Learn Python from scratch',
            full_description: '<h3>About</h3><p>Complete Python course</p>',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            price: 1999000,
            discount_price: 499000,
            category_id: 1
        },
        categories: [
            { id: 1, name: 'Lập trình' },
            { id: 2, name: 'Kinh doanh' }
        ]
    });
});

router.post('/teacher/courses', function (req, res) {
    res.json({ success: true, message: 'Tạo khóa học thành công!' });
});

router.post('/teacher/course/:id', function (req, res) {
    res.json({ success: true, message: 'Cập nhật khóa học thành công!' });
});

router.delete('/teacher/course/:id', function (req, res) {
    res.json({ success: true, message: 'Đã xóa khóa học!' });
});

router.post('/teacher/course/:id/sections', function (req, res) {
    res.json({ success: true, message: 'Tạo chương thành công!' });
});

router.post('/teacher/course/:courseId/section/:sectionId/lectures', function (req, res) {
    res.json({ success: true, message: 'Tạo bài giảng thành công!' });
});

router.delete('/teacher/course/:courseId/section/:sectionId', function (req, res) {
    res.json({ success: true, message: 'Đã xóa chương!' });
});

router.delete('/teacher/course/:courseId/lecture/:lectureId', function (req, res) {
    res.json({ success: true, message: 'Đã xóa bài giảng!' });
});

router.post('/teacher/course/:id/publish', function (req, res) {
    res.json({ success: true, message: 'Đã xuất bản khóa học!' });
});

export default router;
