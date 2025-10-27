import express from 'express';
import { getStudentDashboard, getStudentCourses, getStudentWatchlist, getCourseLearningData } from '../models/user.model.js';
const router = express.Router();

router.get("/student/dashboard", async (req, res, next) => {
  try {
    //const studentId = req.user.id;
    const studentId = "f5555555-5555-5555-5555-555555555555";
    const data = await getStudentDashboard(studentId);
    console.log("Dashboard data:", data);
    if (!data) return res.redirect('/404');
    res.render("vwStudent/dashboard", {
      title: "Trang chủ học viên",
      ...data, // user, stats, recentCourses, recommendedCourses
      layout: "main",   
    });
  } catch (err) {
    next(err);
  }
});

router.get("/student/my-courses", async (req, res, next) => {
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

    res.render("vwStudent/my-courses", {
      title: "Khóa học của tôi",
      user: data.user,
      enrolledCourses: data.enrolledCourses,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/student/watchlist", async (req, res, next) => {
  try {
    
    const studentId = "f4444444-4444-4444-4444-444444444444";

    const data = await getStudentWatchlist(studentId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy học viên",
        message: "Tài khoản không tồn tại hoặc chưa có danh sách yêu thích.",
        layout: "main",
      });
    }

    res.render("vwStudent/watchlist", {
      title: "Danh sách yêu thích",
      user: data.user,
      watchlist: data.watchlist,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/learn/:courseId/sections/:sectionId/lectures/:lectureId', async (req, res, next) => {
  try {
    const studentId = "f4444444-4444-4444-4444-444444444444"; // tạm ID học viên
    const { courseId, sectionId, lectureId } = req.params;

    const data = await getCourseLearningData(studentId, courseId, sectionId, lectureId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy nội dung",
        message: "Bài học hoặc khóa học này không tồn tại.",
        layout: "main",
      });
    }

    res.render("vwStudent/learn", {
      layout: false,
      ...data,
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

router.post('/learn/:courseId/lecture/:lectureId/complete', function(req, res) { res.json({ success: true, message: 'Đã đánh dấu hoàn thành!' }); });
router.post('/learn/:courseId/notes', function(req, res) {
    res.json({ success: true, message: 'Đã lưu ghi chú!' });
});

router.delete('/learn/:courseId/notes/:noteId', function(req, res) {
    res.json({ success: true, message: 'Đã xóa ghi chú!' });
});

export default router;