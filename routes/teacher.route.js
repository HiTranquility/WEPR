import express from 'express';
import database from '../utils/database.js';
import { getTeacherDashboard, getTeacherCourses, getCourseById, getTeacherCourseDetail, getTeacherManageCourse, getTeacherCourseContent, getCourseSectionInfo, getCourseInfoForSection, getCourseDetailForEdit } from '../models/user.model.js';
import { getAllCategories } from '../models/course-category.model.js'; 
const router = express.Router();

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

router.get("/teacher/courses", async (req, res, next) => {
  try {
    // 🔹 Dùng teacherId thật từ DB
    const teacherId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // John Doe

    const teacher = await database("users")
      .where("id", teacherId)
      .first("id", "full_name");

    if (!teacher) {
      return res.status(404).render("404", {
        title: "Không tìm thấy giảng viên",
        message: "Không tồn tại giảng viên với ID này trong cơ sở dữ liệu.",
        layout: "main",
      });
    }

    const courses = await getTeacherCourses(teacher.id);

    res.render("vwTeacher/course-list", {
      title: `Khóa học của tôi - ${teacher.full_name}`,
      courses,
      layout: "main",
    });
  } catch (err) {
    console.error("❌ Lỗi khi load danh sách khóa học giảng viên:", err);
    next(err);
  }
});

router.get("/teacher/create-course", async (req, res, next) => {
  try {
    // 🔹 Lấy danh sách lĩnh vực thực tế từ DB
    const categories = await getAllCategories();

    // 🔹 Nếu chưa có danh mục, báo lỗi
    if (!categories.length) {
      return res.status(404).render("404", {
        title: "Không có lĩnh vực nào",
        message: "Hãy thêm danh mục vào bảng categories để tạo khóa học.",
        layout: "main",
      });
    }

    res.render("vwTeacher/create-course", {
      title: "Tạo khóa học mới",
      categories,
      layout: "main",
    });
  } catch (err) {
    console.error("❌ Lỗi khi load trang tạo khóa học:", err);
    next(err);
  }
});

router.get("/teacher/edit-course/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔹 Lấy thông tin khóa học thật từ DB
    const course = await getCourseById(id);
    if (!course) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học bạn muốn chỉnh sửa không tồn tại.",
        layout: "main",
      });
    }

    // 🔹 Lấy danh sách danh mục thật từ bảng categories
    const categories = await getAllCategories();

    // 🔹 Render ra giao diện
    res.render("vwTeacher/create-course", {
      title: "Chỉnh sửa khóa học",
      isEdit: true,           // cờ để view nhận biết đang ở chế độ chỉnh sửa
      course,                 // dữ liệu khóa học thật
      categories,             // danh mục thật
      layout: "main",
    });
  } catch (err) {
    console.error("❌ Lỗi khi load trang chỉnh sửa khóa học:", err);
    next(err);
  }
});

router.get("/teacher/course/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await getTeacherCourseDetail(id);

    if (!course) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học này không tồn tại hoặc đã bị xóa.",
        layout: "main",
      });
    }

    res.render("vwTeacher/course-detail", {
      title: "Chi tiết khóa học",
      course,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/teacher/course/:id/manage", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔹 Lấy thông tin khóa học thật
    const course = await getTeacherManageCourse(id);

    if (!course) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học bạn muốn quản lý không tồn tại hoặc đã bị xóa.",
        layout: "main",
      });
    }

    // 🔹 Render ra giao diện quản lý khóa học
    res.render("vwTeacher/manage-course", {
      title: "Quản lý khóa học",
      course,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/teacher/course/:id/content", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔹 Lấy dữ liệu khóa học + section + lecture
    const course = await getTeacherCourseContent(id);

    if (!course) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học bạn muốn quản lý không tồn tại hoặc chưa có nội dung.",
        layout: "main",
      });
    }

    res.render("vwTeacher/manage-content", {
      title: "Quản lý nội dung",
      course,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/teacher/course/:courseId/section/:sectionId/lecture/create", async (req, res, next) => {
    try {
      const { courseId, sectionId } = req.params;
      console.log("courseId:", courseId, "sectionId:", sectionId);

      const info = await getCourseSectionInfo(courseId, sectionId);
      console.log("info:", info);

      if (!info) {
        return res.status(404).render("404", {
          title: "Không tìm thấy khóa học hoặc chương học",
          message: "Phần học hoặc khóa học bạn chọn không tồn tại hoặc đã bị xóa.",
          layout: "main",
        });
      }

      res.render("vwTeacher/create-lecture", {
        title: "Tạo bài giảng mới",
        courseId: info.course_id,
        courseTitle: info.course_title,
        sectionId: info.section_id,
        sectionTitle: info.section_title,
        layout: "main",
      });
    } catch (err) {
      console.error("❌ Lỗi:", err);
      next(err);
    }
  }
);

router.get("/teacher/course/:courseId/section/create", async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // 🔹 Gọi hàm model
    const course = await getCourseInfoForSection(courseId);

    if (!course) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học bạn muốn thêm chương không tồn tại hoặc đã bị xóa.",
        layout: "main",
      });
    }

    res.render("vwTeacher/create-section", {
      title: "Tạo chương mới",
      courseId: course.course_id,
      courseTitle: course.course_title,
      teacherName: course.teacher_name,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

// router.get('/teacher/course/:courseId/section/:sectionId/edit', function(req, res) {
//     res.render('vwTeacher/edit-content', {
//         title: 'Chỉnh sửa nội dung',
//         courseId: req.params.courseId,
//         content: {
//             id: req.params.contentId,
//             title: 'Introduction to Course',
//             video_url: '',
//             description: ''
//         }
//     });
// });

router.get("/teacher/course/:id/edit", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔹 Lấy dữ liệu thật từ DB
    const course = await getCourseDetailForEdit(id);
    console.log("getCourseDetailForEdit:", course);

    if (!course) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học bạn muốn chỉnh sửa không tồn tại hoặc đã bị xóa.",
        layout: "main",
      });
    }

    // 🔹 Lấy danh sách danh mục thật
    const categories = await getAllCategories();

    res.render("vwTeacher/edit-course", {
      title: "Chỉnh sửa khóa học",
      course: {
        id: course.course_id,
        title: course.title,
        short_description: course.short_description,
        full_description: course.detailed_description,
        thumbnail_url: course.thumbnail_url,
        price: course.price,
        discount_price: course.discount_price,
        category_id: course.category_id,
        status: course.status,
      },
      categories,
      teacherName: course.teacher_name,
      layout: "main",
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
