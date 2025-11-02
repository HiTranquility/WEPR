import express from 'express';
import { getStudentDashboard, getStudentCourses, getStudentWatchlist, getCourseLearningData, getStudentProfileInfo } from '../models/user.model.js';
import { getAllCategories } from '../models/course-category.model.js';
import { ensureAuthenticated } from '../middlewares/student.middleware.js';
import { requireRole } from '../middlewares/student.middleware.js';
import database from '../utils/database.js';
const router = express.Router();

router.use('/student', ensureAuthenticated, requireRole('student'));

router.get("/student/dashboard", async (req, res, next) => {
    try {
        // ensureAuthenticated sets req.user
        const studentId = req.user && req.user.id ? req.user.id : null;
        if (!studentId) return res.redirect('/signin');

        const data = await getStudentDashboard(studentId);
        const allCategories = await getAllCategories({ includeCounts: false });
        if (!data) return res.redirect('/404');
        res.render("vwStudent/dashboard", {
            title: "Trang chủ học viên",
            ...data, // user, stats, recentCourses, recommendedCourses
            allCategories,
            searchQuery: null,
            layout: "main",
        });
    } catch (err) {
        next(err);
    }
});

router.get('/student/profile', async function(req, res, next) {
  try {
    const studentId = req.user && req.user.id ? req.user.id : null;
    if (!studentId) return res.redirect('/signin');

    const data = await getStudentProfileInfo(studentId);
    if (!data) {
      return res.status(404).render('404', {
        title: 'Không tìm thấy học viên',
        message: 'Tài khoản không tồn tại.',
        layout: 'main'
      });
    }

    res.render('vwStudent/profile', {
      title: 'Thông tin cá nhân',
      ...data,
      searchQuery: null,
      layout: 'main'
    });
  } catch (err) {
    next(err);
  }
});

router.get("/student/my-courses", async (req, res, next) => {
    try {
        const studentId = req.user && req.user.id ? req.user.id : null;
        if (!studentId) return res.redirect('/signin');

        const data = await getStudentCourses(studentId);

        if (!data) {
            return res.status(404).render("404", {
                title: "Không tìm thấy học viên",
                message: "Tài khoản không tồn tại hoặc chưa ghi danh khóa học nào.",
                layout: "main",
            });
        }

        const allCategories = await getAllCategories({ includeCounts: false });
        res.render("vwStudent/my-courses", {
            title: "Khóa học của tôi",
            user: data.user,
            enrolledCourses: data.enrolledCourses,
            allCategories,
            searchQuery: null,
            layout: "main",
        });
    } catch (err) {
        next(err);
    }
});

router.get('/student/wishlist', async function(req, res, next) {
    try {
        const studentId = req.user && req.user.id ? req.user.id : null;
        if (!studentId) return res.redirect('/signin');

        const data = await getStudentWatchlist(studentId);
        if (!data) {
          return res.status(404).render('404', { title: 'Không tìm thấy', message: 'Không tìm thấy danh sách yêu thích', layout: 'main' });
        }

        const allCategories = await getAllCategories({ includeCounts: false });
        res.render('vwStudent/wishlist', {
            title: 'Danh sách yêu thích',
            user: data.user,
            watchlist: data.watchlist,
            allCategories,
            layout: 'main'
        });
    } catch (err) {
        next(err);
    }
});

router.get('/student/learn/:courseId', async function(req, res, next) {
    try {
        const studentId = req.user && req.user.id ? req.user.id : null;
        if (!studentId) return res.redirect('/signin');

        const courseId = req.params.courseId;
        const data = await getCourseLearningData(studentId, courseId);
        if (!data) return res.status(404).render('404', { title: 'Không tìm thấy khóa học', message: 'Khóa học không tồn tại hoặc bạn chưa được ghi danh.', layout: false });

        res.render('vwStudent/learn', {
            layout: false,
            ...data
        });
    } catch (err) {
        next(err);
    }
});

router.get('/student/settings', async function(req, res, next) {
  try {
      const allCategories = await getAllCategories({ includeCounts: false });
      res.render('vwStudent/settings', {
          title: 'Cài đặt tài khoản',
          allCategories,
          searchQuery: null,
          layout: 'main'
      });
  } catch (err) {
      next(err);
  }
});

router.post('/student/profile', function(req, res) {
    res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
});

router.post('/student/change-password', function(req, res) {
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

router.post('/student/watchlist/:courseId', function(req, res) {
    res.json({ success: true, message: 'Đã thêm vào watchlist!' });
});

router.delete('/student/watchlist/:courseId', function(req, res) {
    res.json({ success: true, message: 'Đã xóa khỏi watchlist!' });
});

router.post('/student/learn/:courseId/lecture/:lectureId/complete', function (req, res) {
    res.json({ success: true, message: 'Đã đánh dấu hoàn thành!' });
});

router.post('/student/learn/:courseId/notes', function (req, res) {
    res.json({ success: true, message: 'Đã lưu ghi chú!' });
});

router.delete('/student/learn/:courseId/notes/:noteId', function (req, res) {
    res.json({ success: true, message: 'Đã xóa ghi chú!' });
});

router.post('/student/watchlist/:courseId', async function(req, res, next) {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;
    
    await database('watchlist').insert({
      student_id: studentId,
      course_id: courseId,
      added_at: new Date()
    }).onConflict(['student_id', 'course_id']).ignore();
    
    res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích!' });
  } catch (err) {
    res.json({ success: false, message: 'Có lỗi xảy ra!' });
  }
});

router.delete('/student/watchlist/:courseId', async function(req, res, next) {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;
    
    await database('watchlist')
      .where({ student_id: studentId, course_id: courseId })
      .del();
    
    res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích!' });
  } catch (err) {
    res.json({ success: false, message: 'Có lỗi xảy ra!' });
  }
});

router.post('/student/enroll/:courseId', async function(req, res, next) {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;
    
    const existing = await database('enrollments')
      .where({ student_id: studentId, course_id: courseId })
      .first();
    
    if (existing) {
      return res.json({ success: false, message: 'Bạn đã đăng ký khóa học này rồi!' });
    }
    
    await database('enrollments').insert({
      student_id: studentId,
      course_id: courseId,
      enrolled_at: new Date()
    });
    
    await database('courses')
      .where({ id: courseId })
      .increment('enrollment_count', 1);
    
    res.json({ success: true, message: 'Đăng ký khóa học thành công!' });
  } catch (err) {
    res.json({ success: false, message: 'Có lỗi xảy ra!' });
  }
});

router.post('/student/review/:courseId', async function(req, res, next) {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    
    const enrolled = await database('enrollments')
      .where({ student_id: studentId, course_id: courseId })
      .first();
    
    if (!enrolled) {
      return res.json({ success: false, message: 'Bạn phải đăng ký khóa học trước khi đánh giá!' });
    }
    
    await database('reviews').insert({
      student_id: studentId,
      course_id: courseId,
      rating: rating,
      comment: comment,
      created_at: new Date()
    }).onConflict(['student_id', 'course_id']).merge();
    
    const reviews = await database('reviews')
      .where({ course_id: courseId })
      .select('rating');
    
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await database('courses')
      .where({ id: courseId })
      .update({
        rating_avg: avgRating.toFixed(1),
        rating_count: reviews.length
      });
    
    res.json({ success: true, message: 'Đánh giá thành công!' });
  } catch (err) {
    res.json({ success: false, message: 'Có lỗi xảy ra!' });
  }
});

export default router;
