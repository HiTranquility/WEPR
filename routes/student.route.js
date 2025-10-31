import express from 'express';
import { getStudentDashboard, getStudentCourses, getStudentWatchlist, getCourseLearningData } from '../models/user.model.js';
import { getAllCategories } from '../models/course-category.model.js';
import { ensureAuthenticated } from '../middlewares/student.middleware.js';
import { requireRole } from '../middlewares/student.middleware.js';
const router = express.Router();

router.use('/student', ensureAuthenticated, requireRole('student'));

router.get("/student/dashboard", async (req, res, next) => {
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

router.get('/student/watchlist', function(req, res) {
    res.render('vwStudent/watchlist', {
        title: 'Danh sách yêu thích',
        user: {
            full_name: 'Nguyễn Văn A',
            email: 'student@example.com',
            avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
        },
        watchlist: [
            {
                id: 1,
                course: {
                    id: 2,
                    title: 'The Complete JavaScript Course 2024',
                    thumbnail_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
                    rating_avg: 4.7,
                    rating_count: 5234,
                    enrollment_count: 35000,
                    discount_price: 399000,
                    category: { name: 'Lập trình' },
                    teacher: {
                        full_name: 'Jonas Schmedtmann',
                        avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg'
                    }
                }
            }
        ]
    });
});

router.get('/student/learn/:courseId', function(req, res) {
    res.render('vwStudent/learn', {
        layout: false,
        course: {
            id: req.params.courseId,
            title: 'Complete Python Bootcamp',
            category: { name: 'Lập trình' },
            sections: [
                {
                    title: 'Course Introduction',
                    lectures: [
                        {
                            id: 1,
                            title: 'Introduction to Course',
                            duration: '10:30',
                            is_completed: true,
                            description: 'Welcome to the course!'
                        },
                        {
                            id: 2,
                            title: 'Course Curriculum Overview',
                            duration: '15:45',
                            is_completed: false,
                            description: 'Overview of what we will learn'
                        }
                    ]
                }
            ]
        },
        currentLecture: {
            id: 1,
            title: 'Introduction to Course',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            description: 'Welcome to the course! In this lecture, we will introduce you to the course content.',
            resources: []
        },
        currentLectureIndex: 1,
        totalLectures: 185,
        completedLectures: 15,
        progress: 8,
        notes: []
    });
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

export default router;
