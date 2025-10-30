import express from 'express';
import { getStudentDashboard, getStudentCourses, getStudentWatchlist, getCourseLearningData } from '../models/user.model.js';
import { getAllCategories } from '../models/course-category.model.js';
import { ensureAuthenticated } from '../middlewares/student.middleware.js';
import { requireRole } from '../middlewares/student.middleware.js';
const router = express.Router();

//router.use('/', ensureAuthenticated, requireRole('student'));

router.get("/dashboard", async (req, res, next) => {
  try {
    //const studentId = req.user.id;
    const studentId = "f5555555-5555-5555-5555-555555555555";
    const data = await getStudentDashboard(studentId);
    const allCategories = await getAllCategories({ includeCounts: false });
    console.log("Dashboard data:", data);
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

router.get("/my-courses", async (req, res, next) => {
  try {
    
    const studentId = "f4444444-4444-4444-4444-444444444444";

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



router.get('/watchlist', async (req, res, next) => {
  try {
    // 👉 Giả sử tạm thời dùng ID học viên cố định (vì chưa có login)
    const studentId = 'f4444444-4444-4444-4444-444444444444';
    
    // Lấy dữ liệu từ DB
    const watchlist = await getStudentWatchlist(studentId);

    // Render ra view
    res.render('vwStudent/wishlist', {
      title: 'Danh sách yêu thích',
      user: {
        full_name: 'Nguyễn Văn A',
        email: 'student@example.com',
        avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
      },
      watchlist
    });
  } catch (err) {
    console.error('Error loading watchlist:', err);
    next(err);
  }
});

router.get('/learn/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // ⚙️ Tạm thời hardcode studentId (sau này thay bằng req.session.user.id)
    const studentId = 'f1111111-1111-1111-1111-111111111111';

    // 🔹 Lấy dữ liệu học từ model
    const data = await getCourseLearningData(studentId, courseId);

    if (!data) {
      return res.status(404).render('404', { title: 'Không tìm thấy khóa học' });
    }

    // 🔹 Tính thêm tổng số bài giảng, tiến độ nếu cần
    const totalLectures = data.course.sections.reduce(
      (sum, sec) => sum + sec.lectures.length,
      0
    );
    const completedLectures = 0; // chưa có bảng progress thì để 0
    const progress =
      totalLectures > 0
        ? Math.round((completedLectures / totalLectures) * 100)
        : 0;

    // 🔹 Render ra trang học
    res.render('vwStudent/learn', {
      layout: false,
      course: data.course,
      currentLecture: data.currentLecture,
      currentLectureIndex: data.currentLectureIndex,
      totalLectures,
      completedLectures,
      progress,
      notes: data.notes,
    });
  } catch (err) {
    console.error('Error in /learn/:courseId:', err);
    next(err);
  }
});

router.post('/profile', function(req, res) {
    res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
});

router.post('/change-password', function(req, res) {
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

router.post('/watchlist/:courseId', function(req, res) {
    res.json({ success: true, message: 'Đã thêm vào watchlist!' });
});

router.delete('/watchlist/:courseId', function(req, res) {
    res.json({ success: true, message: 'Đã xóa khỏi watchlist!' });
});

router.post('/learn/:courseId/lecture/:lectureId/complete', function (req, res) {
    res.json({ success: true, message: 'Đã đánh dấu hoàn thành!' });
});

router.post('/learn/:courseId/notes', function (req, res) {
    res.json({ success: true, message: 'Đã lưu ghi chú!' });
});

router.delete('/learn/:courseId/notes/:noteId', function (req, res) {
    res.json({ success: true, message: 'Đã xóa ghi chú!' });
});

export default router;
