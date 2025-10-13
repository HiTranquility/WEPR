import express from 'express';

const router = express.Router();

router.get('/teacher/courses', function(req, res) {
    res.render('vwTeacher/my-courses', {
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

router.get('/teacher/create-course', function(req, res) {
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

router.get('/teacher/edit-course/:id', function(req, res) {
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

export default router;
