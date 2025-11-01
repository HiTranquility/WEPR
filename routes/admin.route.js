import express from 'express';
import { ensureAuthenticated, requireRole } from '../middlewares/admin.middleware.js';
import {getAdminDashboardStats, getAllAdminCategories, getAllAdminCourses, getAllAdminUsers } from '../models/admin.model.js';
const router = express.Router();

router.use('/admin', ensureAuthenticated, requireRole('admin'));

router.get('/admin/dashboard', async function(req, res, next) {
  try {
    const data = await getAdminDashboardStats();
    res.render('vwAdmin/dashboard', {
        layout: 'admin',
        title: 'Dashboard',
        activeMenu: 'dashboard',
        stats: data.stats,
        recentActivities: data.recentActivities,
        popularCourses: data.popularCourses,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/categories', async function(req, res, next) {
    try {
        const categories = await getAllAdminCategories();
        res.render('vwAdmin/categories', {
            layout: 'admin',
            title: 'Quản lý lĩnh vực',
            activeMenu: 'categories',
            categories,
        });
    } catch (err) { next(err); }
});

router.get('/admin/courses', async function(req, res, next) {
    try {
        const courses = await getAllAdminCourses();
        const categories = await getAllAdminCategories();
        res.render('vwAdmin/courses', {
            layout: 'admin',
            title: 'Quản lý khóa học',
            activeMenu: 'courses',
            courses,
            categories,
        });
    } catch (err) { next(err); }
});

router.get('/admin/users', async function(req, res, next) {
    try {
        const users = await getAllAdminUsers();
        res.render('vwAdmin/users', {
            layout: 'admin',
            title: 'Quản lý người dùng',
            activeMenu: 'users',
            users,
        });
    } catch (err) { next(err); }
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
