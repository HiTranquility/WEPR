import express from 'express';
import { getAllAdminCategories, getAllAdminCourses, getAllAdminUsers, getAdminDashboardStats} from '../models/admin.model.js';
const router = express.Router();

router.get("/admin/categories", async (req, res, next) => {
  try {
    const categories = await getAllAdminCategories(); 

    res.render("vwAdmin/categories", {
      layout: "admin",
      title: "Quản lý lĩnh vực",
      activeMenu: "categories",
      categories, 
    });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/courses", async (req, res, next) => {
  try {
    const courses = await getAllAdminCourses();       
    const categories = await getAllAdminCategories(); 

    res.render("vwAdmin/courses", {
      layout: "admin",
      title: "Quản lý khóa học",
      activeMenu: "courses",
      courses,
      categories,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/users", async (req, res, next) => {
  try {
    const users = await getAllAdminUsers(); // 

    res.render("vwAdmin/users", {
      layout: "admin",
      title: "Quản lý người dùng",
      activeMenu: "users",
      users,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/dashboard", async (req, res, next) => {
  try {
    const data = await getAdminDashboardStats();

    res.render("vwAdmin/dashboard", {
      layout: "admin",
      title: "Dashboard",
      activeMenu: "dashboard",
      ...data, // Gồm stats, recentActivities, popularCourses
    });
  } catch (err) {
    next(err);
  }
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
