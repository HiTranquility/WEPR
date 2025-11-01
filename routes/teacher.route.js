import express from 'express';
import { getTeacherDashboard, getTeacherCourses, getTeacherCourseDetail, getTeacherManageCourse, getTeacherCourseContent, getCourseSectionInfo, getCourseInfoForSection, getCourseDetailForEdit } from '../models/user.model.js';
import { getAllCategories } from '../models/course-category.model.js'; 
import { ensureAuthenticated } from '../middlewares/teacher.middleware.js';
import { requireRole } from '../middlewares/teacher.middleware.js';
const router = express.Router();

router.use('/teacher', ensureAuthenticated, requireRole('teacher'));

router.get("/teacher/dashboard", async (req, res, next) => {
  try {
    const teacherId = req.user && req.user.id ? req.user.id : null;
    if (!teacherId) return res.redirect('/signin');

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
    const teacherId = req.user && req.user.id ? req.user.id : null;
    if (!teacherId) return res.redirect('/signin');

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

router.get('/teacher/course/:id/edit', async function(req, res, next) {
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
    const data = await getCourseDetailForEdit(req.params.id);

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
    const data = await getTeacherCourseDetail(req.params.id);

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

router.get('/teacher/course/:courseId/content/:contentId/edit', async function(req, res, next) {
  try {
    const courseId = req.params.courseId;
    const contentId = req.params.contentId;

    const courseData = await getTeacherCourseContent(courseId);
    if (!courseData) {
      return res.status(404).render('404', { title: 'Không tìm thấy khóa học', message: 'Khóa học không tồn tại.', layout: 'main' });
    }

    let foundLecture = null;
    let parentSectionId = null;
    for (const section of courseData.sections || []) {
      const lec = (section.lectures || []).find(l => String(l.id) === String(contentId));
      if (lec) {
        foundLecture = lec;
        parentSectionId = section.id || null;
        break;
      }
    }

    if (!foundLecture) {
      return res.status(404).render('404', { title: 'Không tìm thấy bài giảng', message: 'Bài giảng không tồn tại trong khóa học này.', layout: 'main' });
    }

    res.render('vwTeacher/edit-content', {
      title: 'Chỉnh sửa nội dung',
      courseId,
      sectionId: parentSectionId,
      content: {
        id: foundLecture.id,
        title: foundLecture.title || '',
        video_url: foundLecture.video_url || '',
        description: foundLecture.description || '',
        is_preview: foundLecture.is_preview || false
      },
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
