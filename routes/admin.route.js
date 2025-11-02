import express from 'express';
import { ensureAuthenticated, requireRole } from '../middlewares/admin.middleware.js';
import {getAdminDashboardStats, getAllAdminCategories, getAllAdminCourses, getAllAdminUsers } from '../models/admin.model.js';
import database from '../utils/database.js';
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
        // Lấy danh sách giảng viên để filter
        const teachers = await database('users')
            .where('role', 'teacher')
            .select('id', 'full_name')
            .orderBy('full_name', 'asc');
        res.render('vwAdmin/courses', {
            layout: 'admin',
            title: 'Quản lý khóa học',
            activeMenu: 'courses',
            courses,
            categories,
            teachers,
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


router.post('/admin/categories', async function(req, res, next) {
    try {
        const { name, parent_id } = req.body;
        const [category] = await database('categories').insert({
            name,
            parent_id: parent_id || null,
            created_at: new Date()
        }).returning('*');
        res.json({ success: true, message: 'Tạo lĩnh vực thành công!', categoryId: category.id });
    } catch (err) {
        next(err);
    }
});

router.post('/admin/categories/:id', async function(req, res, next) {
    try {
        const { name, parent_id } = req.body;
        await database('categories').where({ id: req.params.id }).update({
            name,
            parent_id: parent_id || null
        });
        res.json({ success: true, message: 'Cập nhật lĩnh vực thành công!' });
    } catch (err) {
        next(err);
    }
});

router.delete('/admin/categories/:id', async function(req, res, next) {
    try {
        await database('categories').where({ id: req.params.id }).del();
        res.json({ success: true, message: 'Đã xóa lĩnh vực!' });
    } catch (err) {
        next(err);
    }
});

router.post('/admin/courses/:id', async function(req, res, next) {
    try {
        const { status } = req.body;
        await database('courses').where({ id: req.params.id }).update({
            status: status || 'disabled',
            last_updated: new Date()
        });
        res.json({ success: true, message: 'Cập nhật khóa học thành công!' });
    } catch (err) {
        next(err);
    }
});

router.delete('/admin/courses/:id', async function(req, res, next) {
    try {
        await database('courses').where({ id: req.params.id }).del();
        res.json({ success: true, message: 'Đã gỡ bỏ khóa học!' });
    } catch (err) {
        next(err);
    }
});

router.post('/admin/users', async function(req, res, next) {
    try {
        const { full_name, email, password, role, status } = req.body;
        const bcrypt = (await import('bcrypt')).default;
        const password_hash = await bcrypt.hash(password, 10);

        const [user] = await database('users').insert({
            full_name,
            email,
            password_hash,
            role: role || 'student',
            status: status === undefined ? true : convertStatusToBoolean(status),
            created_at: new Date()
        }).returning('*');

        res.json({ success: true, message: 'Tạo người dùng thành công!', userId: user.id });
    } catch (err) {
        next(err);
    }
});

function convertStatusToBoolean(rawStatus) {
    if (typeof rawStatus === 'boolean') return rawStatus;
    if (rawStatus === null || rawStatus === undefined || rawStatus === '') return true;
    const lowered = String(rawStatus).toLowerCase();
    if (lowered === 'blocked' || lowered === 'inactive' || lowered === 'false' || lowered === '0') return false;
    return true;
}

router.post('/admin/users/:id', async function(req, res, next) {
    try {
        const { full_name, email, role, status } = req.body;
        const updatePayload = {
            full_name,
            email,
            updated_at: new Date()
        };
        if (role) updatePayload.role = role;
        if (status !== undefined) updatePayload.status = convertStatusToBoolean(status);

        try {
            await database('users').where({ id: req.params.id }).update(updatePayload);
        } catch (err) {
            if (err?.code === '42703') {
                delete updatePayload.status;
                await database('users').where({ id: req.params.id }).update(updatePayload);
            } else {
                throw err;
            }
        }

        res.json({ success: true, message: 'Cập nhật người dùng thành công!' });
    } catch (err) {
        next(err);
    }
});

router.delete('/admin/users/:id', async function(req, res, next) {
    try {
        await database('users').where({ id: req.params.id }).del();
        res.json({ success: true, message: 'Đã xóa người dùng!' });
    } catch (err) {
        next(err);
    }
});

router.post('/admin/users/:id/role', async function(req, res, next) {
    try {
        const { role } = req.body;
        await database('users').where({ id: req.params.id }).update({
            role,
            updated_at: new Date()
        });
        res.json({ success: true, message: 'Cập nhật quyền thành công!' });
    } catch (err) {
        next(err);
    }
});

router.post('/admin/users/:id/toggle-status', async function(req, res, next) {
  try {
    const user = await database('users').where({ id: req.params.id }).first();
    if (!user) {
      return res.json({ success: false, message: 'Không tìm thấy người dùng!' });
    }
    
    const currentStatus = user.status;
    const newStatus = (currentStatus === 'blocked' || currentStatus === false || currentStatus === 'false') ? 'active' : 'blocked';
    await database('users').where({ id: req.params.id }).update({ status: newStatus });
    
    const msg = newStatus === 'blocked' ? 'khóa' : 'mở khóa';
    res.json({ success: true, message: `Đã ${msg} tài khoản!` });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.json({ success: false, message: 'Có lỗi xảy ra!' });
  }
});

router.post('/admin/courses/:id/toggle-status', async function(req, res, next) {
  try {
    const course = await database('courses').where({ id: req.params.id }).first();
    if (!course) {
      return res.json({ success: false, message: 'Không tìm thấy khóa học!' });
    }
    
    const newStatus = course.status === 'completed' ? 'suspended' : 'completed';
    await database('courses').where({ id: req.params.id }).update({ status: newStatus });
    
    const msg = newStatus === 'suspended' ? 'đình chỉ' : 'kích hoạt';
    res.json({ success: true, message: `Đã ${msg} khóa học!` });
  } catch (err) {
    console.error('Toggle course status error:', err);
    res.json({ success: false, message: 'Có lỗi xảy ra!' });
  }
});

export default router;
