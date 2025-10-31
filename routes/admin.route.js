import express from 'express';
import { ensureAuthenticated, requireRole } from '../middlewares/admin.middleware.js';
import { getAdminDashboardStats } from '../models/admin.model.js';
const router = express.Router();

router.use('/admin', ensureAuthenticated, requireRole('admin'));

router.get('/admin/dashboard', async function(req, res, next) {
  try {
    const data = await getAdminDashboardStats();
    res.render('vwAdmin/dashboard', {
        layout: 'admin',
        title: 'Dashboard',
        activeMenu: 'dashboard',
        stats: {
            total_users: 12500,
            total_courses: 856,
            total_teachers: 250,
            total_students: 12000,
            total_revenue: 5600000000,
            pending_courses: 45
        },
        recentActivities: [
            {
                type: 'new_user',
                message: 'Nguyễn Văn A đã đăng ký tài khoản',
                timestamp: new Date()
            },
            {
                type: 'new_course',
                message: 'Khóa học "Python Bootcamp" đã được tạo',
                timestamp: new Date()
            }
        ],
        popularCourses: [
            {
                id: 1,
                title: 'Complete Python Bootcamp',
                enrollment_count: 4256,
                rating_avg: 4.6
            }
        ]
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/categories', function(req, res) {
    
    const categories = [
        { id: 1, name: 'Lập trình', course_count: 245, created_at: new Date('2024-01-15') },
        { id: 2, name: 'Kinh doanh', course_count: 189, created_at: new Date('2024-01-16') },
        { id: 3, name: 'Thiết kế', course_count: 156, created_at: new Date('2024-01-17') },
        { id: 4, name: 'Marketing', course_count: 134, created_at: new Date('2024-01-18') }
    ];
    res.render('vwAdmin/categories', {
        layout: 'admin',
        title: 'Quản lý lĩnh vực',
        activeMenu: 'categories',
        categories,
        // categories: 
        // [
        //     { id: 1, name: 'Lập trình', course_count: 245, created_at: new Date('2024-01-15') },
        //     { id: 2, name: 'Kinh doanh', course_count: 189, created_at: new Date('2024-01-16') },
        //     { id: 3, name: 'Thiết kế', course_count: 156, created_at: new Date('2024-01-17') },
        //     { id: 4, name: 'Marketing', course_count: 134, created_at: new Date('2024-01-18') },
        //     { id: 5, name: 'Khoa học dữ liệu', course_count: 98, created_at: new Date('2024-01-19') },
        //     { id: 6, name: 'Phát triển cá nhân', course_count: 167, created_at: new Date('2024-01-20') },
        //     { id: 7, name: 'Nhiếp ảnh', course_count: 87, created_at: new Date('2024-01-21') },
        //     { id: 8, name: 'Âm nhạc', course_count: 65, created_at: new Date('2024-01-22') }
        // ],
    });
});

router.get('/admin/courses', function(req, res) {
    res.render('vwAdmin/courses', {
        layout: 'admin',
        title: 'Quản lý khóa học',
        activeMenu: 'courses',
        courses: [
            {
                id: 1,
                title: 'Complete Python Bootcamp: Go from zero to hero in Python 3',
                thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
                rating_avg: 4.6,
                rating_count: 4789,
                enrollment_count: 42567,
                discount_price: 499000,
                status: 'published',
                category: { name: 'Lập trình' },
                teacher: { full_name: 'Jose Portilla' }
            },
            {
                id: 2,
                title: 'The Complete JavaScript Course 2024: From Zero to Expert!',
                thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
                rating_avg: 4.7,
                rating_count: 5234,
                enrollment_count: 35890,
                discount_price: 399000,
                status: 'published',
                category: { name: 'Lập trình' },
                teacher: { full_name: 'Jonas Schmedtmann' }
            },
            {
                id: 3,
                title: 'React - The Complete Guide 2024',
                thumbnail_url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
                rating_avg: 4.8,
                rating_count: 6123,
                enrollment_count: 45678,
                discount_price: 449000,
                status: 'published',
                category: { name: 'Lập trình' },
                teacher: { full_name: 'Maximilian Schwarzmüller' }
            },
            {
                id: 4,
                title: 'The Complete Digital Marketing Course',
                thumbnail_url: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
                rating_avg: 4.5,
                rating_count: 3456,
                enrollment_count: 28900,
                discount_price: 399000,
                status: 'draft',
                category: { name: 'Marketing' },
                teacher: { full_name: 'Rob Percival' }
            },
            {
                id: 5,
                title: 'Machine Learning A-Z: AI, Python & R',
                thumbnail_url: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg',
                rating_avg: 4.5,
                rating_count: 7890,
                enrollment_count: 52341,
                discount_price: 599000,
                status: 'published',
                category: { name: 'Khoa học dữ liệu' },
                teacher: { full_name: 'Kirill Eremenko' }
            }
        ],
        categories: [
            { id: 1, name: 'Lập trình' },
            { id: 2, name: 'Kinh doanh' },
            { id: 3, name: 'Thiết kế' },
            { id: 4, name: 'Marketing' },
            { id: 5, name: 'Khoa học dữ liệu' }
        ]
    });
});

router.get('/admin/users', function(req, res) {
    res.render('vwAdmin/users', {
        layout: 'admin',
        title: 'Quản lý người dùng',
        activeMenu: 'users',
        users: [
            {
                id: 1,
                full_name: 'Admin User',
                email: 'admin@example.com',
                role: 'admin',
                avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
                created_at: new Date('2024-01-01')
            },
            {
                id: 2,
                full_name: 'Jose Portilla',
                email: 'jose@example.com',
                role: 'teacher',
                avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
                created_at: new Date('2024-01-15')
            },
            {
                id: 3,
                full_name: 'Jonas Schmedtmann',
                email: 'jonas@example.com',
                role: 'teacher',
                avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
                created_at: new Date('2024-01-16')
            },
            {
                id: 4,
                full_name: 'Nguyễn Văn A',
                email: 'student1@example.com',
                role: 'student',
                avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
                created_at: new Date('2024-02-01')
            },
            {
                id: 5,
                full_name: 'Trần Thị B',
                email: 'student2@example.com',
                role: 'student',
                avatar_url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
                created_at: new Date('2024-02-05')
            },
            {
                id: 6,
                full_name: 'Lê Văn C',
                email: 'student3@example.com',
                role: 'student',
                avatar_url: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
                created_at: new Date('2024-02-10')
            }
        ]
    });
});

router.get('/admin/settings', function(req, res) {
    res.render('vwAdmin/settings', {
        layout: 'admin',
        title: 'Cài đặt hệ thống',
        activeMenu: 'settings'
    });
});


router.post('/admin/categories', function(req, res) {
    res.json({ success: true, message: 'Tạo lĩnh vực thành công!' });
});

router.post('/admin/categories/:id', function(req, res) {
    res.json({ success: true, message: 'Cập nhật lĩnh vực thành công!' });
});

router.delete('/admin/categories/:id', function(req, res) {
    res.json({ success: true, message: 'Đã xóa lĩnh vực!' });
});

router.post('/admin/courses/:id', function(req, res) {
    res.json({ success: true, message: 'Cập nhật khóa học thành công!' });
});

router.delete('/admin/courses/:id', function(req, res) {
    res.json({ success: true, message: 'Đã gỡ bỏ khóa học!' });
});

router.post('/admin/users', function(req, res) {
    res.json({ success: true, message: 'Tạo người dùng thành công!' });
});

router.post('/admin/users/:id', function(req, res) {
    res.json({ success: true, message: 'Cập nhật người dùng thành công!' });
});

router.delete('/admin/users/:id', function(req, res) {
    res.json({ success: true, message: 'Đã xóa người dùng!' });
});

router.post('/admin/users/:id/role', function(req, res) {
    res.json({ success: true, message: 'Cập nhật quyền thành công!' });
});

export default router;
