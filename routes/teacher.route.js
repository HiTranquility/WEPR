import express from 'express';
import database from '../utils/database.js';
import { getTeacherDashboard, getTeacherCourses, getCourseById, getTeacherCourseDetail, getTeacherManageCourse, getTeacherCourseContent, getCourseSectionInfo, getCourseInfoForSection, getCourseDetailForEdit } from '../models/user.model.js';
import { getAllCategories } from '../models/course-category.model.js'; 
import { ensureAuthenticated } from '../middlewares/teacher.middleware.js';
import { requireRole } from '../middlewares/teacher.middleware.js';
const router = express.Router();

router.use('/teacher', ensureAuthenticated, requireRole('teacher'));

router.get("/teacher/dashboard", async (req, res, next) => {
  try {
    const teacherId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    const data = await getTeacherDashboard(teacherId);
    const allCategories = await getAllCategories({ includeCounts: false });

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy giảng viên",
        message: "Tài khoản giảng viên không tồn tại.",
        layout: "main",
      });
    }

    res.render("vwTeacher/dashboard", {
      title: "Trang chủ giảng viên",
      ...data, // teacher, stats, recentCourses
      allCategories,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/courses', async function(req, res, next) {
  try {
    const teacherId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const data = await getTeacherCourses(teacherId);
    const allCategories = await getAllCategories({ includeCounts: false });

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy giảng viên",
        message: "Tài khoản giảng viên không tồn tại.",
        layout: "main",
      });
    }

    res.render('vwTeacher/course-list', {
      title: 'Khóa học của tôi - Giảng viên',
      courses: data,
      allCategories,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/create-course', async function(req, res, next) {
  try {
    const allCategories = await getAllCategories({ includeCounts: false });

    res.render('vwTeacher/create-course', {
      title: 'Tạo khóa học mới',
      categories: allCategories,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/edit-course/:id', async function(req, res, next) {
  try {
    const allCategories = await getAllCategories({ includeCounts: false });

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    res.render('vwTeacher/edit-course', {
      title: 'Chỉnh sửa khóa học',
      isEdit: true,
      course: data,
      categories: allCategories,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/course/:id', async function(req, res, next) {
  try {
    const data = await getCourseDetailForEdit(req.params.id);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    res.render('vwTeacher/course-detail', {
        title: 'Chi tiết khóa học',
      course: data,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/course/:id/manage', async function(req, res, next) {
  try {
      const data = await getTeacherManageCourse(req.params.id);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    res.render('vwTeacher/manage-course', {
      title: 'Quản lý khóa học',
      course: data,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/course/:id/content', async function(req, res, next) {
  try {
    const data = await getTeacherCourseContent(req.params.id);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    res.render('vwTeacher/manage-content', {
      title: 'Quản lý nội dung',
      course: data,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/course/:courseId/section/:sectionId/lecture/create', async function(req, res, next) {
  try {
    const data = await getCourseSectionInfo(req.params.courseId, req.params.sectionId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
    });
        }

    res.render('vwTeacher/create-lecture', {
      title: 'Tạo bài giảng mới',
      courseId: req.params.courseId,
      sectionId: req.params.sectionId,
      lecture: data,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/course/:courseId/content/:contentId/edit', function(req, res) {
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

router.get('/teacher/course/:id/edit', function(req, res) {
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

router.get('/teacher/settings', async function(req, res, next) {
  try {
      const allCategories = await getAllCategories({ includeCounts: false });
      res.render('vwTeacher/settings', {
          title: 'Cài đặt tài khoản',
          allCategories,
          searchQuery: null,
          layout: 'main'
      });
  } catch (err) {
      next(err);
  }
});

router.post('/teacher/courses', function(req, res) {
    res.json({ success: true, message: 'Tạo khóa học thành công!' });
});

router.post('/teacher/course/:id', function(req, res) {
    res.json({ success: true, message: 'Cập nhật khóa học thành công!' });
});

router.delete('/teacher/course/:id', function(req, res) {
    res.json({ success: true, message: 'Đã xóa khóa học!' });
});

router.post('/teacher/course/:id/sections', function(req, res) {
    res.json({ success: true, message: 'Tạo chương thành công!' });
});

router.post('/teacher/course/:courseId/section/:sectionId/lectures', function(req, res) {
    res.json({ success: true, message: 'Tạo bài giảng thành công!' });
});

router.delete('/teacher/course/:courseId/section/:sectionId', function(req, res) {
    res.json({ success: true, message: 'Đã xóa chương!' });
});

router.delete('/teacher/course/:courseId/lecture/:lectureId', function(req, res) {
    res.json({ success: true, message: 'Đã xóa bài giảng!' });
});

router.post('/teacher/course/:id/publish', function(req, res) {
    res.json({ success: true, message: 'Đã xuất bản khóa học!' });
});

export default router;
