import express from 'express';
import {
  getTeacherDashboard,
  getTeacherCourses,
  getTeacherCourseDetail,
  getTeacherManageCourse,
  getTeacherCourseContent,
  getCourseSectionInfo,
  getCourseInfoForSection,
  getCourseDetailForEdit,
  getTeacherSettings,
  updateTeacherProfileInfo,
  updateTeacherPassword,
  upsertTeacherPaymentInfo,
  updateTeacherPreferences,
  getTeacherProfileInfo
} from '../models/user.model.js';
import { getAllCategories } from '../models/course-category.model.js';
import { ensureAuthenticated } from '../middlewares/teacher.middleware.js';
import { requireRole } from '../middlewares/teacher.middleware.js';
import database from '../utils/database.js';
import * as teacherModel from '../models/teacher.model.js';
const router = express.Router();

router.use('/teacher', ensureAuthenticated, requireRole('teacher'));

router.get("/teacher/dashboard", async (req, res, next) => {
  try {
    const teacherId = req.user && req.user.id ? req.user.id : null;
    if (!teacherId) return res.redirect('/signin');

    const data = await getTeacherDashboard(teacherId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy giảng viên",
        message: "Tài khoản giảng viên không tồn tại.",
        layout: "main",
      });
    }

    res.render("vwTeacher/dashboard", {
      title: "Trang chủ giảng viên",
      ...data,
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
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/profile', async function(req, res, next) {
  try {
    const teacherId = req.user && req.user.id ? req.user.id : null;
    if (!teacherId) return res.redirect('/signin');

    const data = await getTeacherProfileInfo(teacherId);

    if (!data) {
      return res.status(404).render('404', {
        title: 'Không tìm thấy giảng viên',
        message: 'Tài khoản giảng viên không tồn tại.',
        layout: 'main'
      });
    }

    res.render('vwTeacher/profile', {
      title: 'Thông tin giảng viên',
      ...data,
      searchQuery: null,
      layout: 'main'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/course/create', async function(req, res, next) {
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

router.get('/teacher/course/:id/edit', async function(req, res, next) {
  try {
    const courseId = req.params.id;
    
    // Verify course belongs to teacher
    const course = await database('courses')
      .where({ id: courseId, teacher_id: req.user.id })
      .first('id');

    if (!course) {
      return res.status(403).render("403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền chỉnh sửa khóa học này.",
        layout: "main",
      });
    }

    const allCategories = await getAllCategories({ includeCounts: false });
    const data = await getCourseDetailForEdit(courseId);

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

router.get('/teacher/edit-course/:id', async function(req, res, next) {
  try {
    const courseId = req.params.id;
    
    // Verify course belongs to teacher
    const course = await database('courses')
      .where({ id: courseId, teacher_id: req.user.id })
      .first('id');

    if (!course) {
      return res.status(403).render("403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền chỉnh sửa khóa học này.",
        layout: "main",
      });
    }

    const allCategories = await getAllCategories({ includeCounts: false });
    const data = await getCourseDetailForEdit(courseId);

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
    const courseId = req.params.id;
    const data = await getTeacherCourseDetail(courseId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    // Verify course belongs to teacher
    const course = await database('courses')
      .where({ id: courseId, teacher_id: req.user.id })
      .first('id');

    if (!course) {
      return res.status(403).render("403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền xem khóa học này.",
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
    const courseId = req.params.id;
    const data = await getTeacherManageCourse(courseId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    // Verify course belongs to teacher
    const course = await database('courses')
      .where({ id: courseId, teacher_id: req.user.id })
      .first('id');

    if (!course) {
      return res.status(403).render("403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền quản lý khóa học này.",
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
    const courseId = req.params.id;
    const data = await getTeacherCourseContent(courseId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    // Verify course belongs to teacher
    const course = await database('courses')
      .where({ id: courseId, teacher_id: req.user.id })
      .first('id');

    if (!course) {
      return res.status(403).render("403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền quản lý nội dung khóa học này.",
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

router.get('/teacher/course/:courseId/section/create', async function(req, res, next) {
  try {
    const courseId = req.params.courseId;
    
    // Verify course belongs to teacher
    const course = await database('courses')
      .where({ id: courseId, teacher_id: req.user.id })
      .first('id', 'title');

    if (!course) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại hoặc bạn không có quyền truy cập.",
        layout: "main",
      });
    }

    res.render('vwTeacher/create-section', {
      title: 'Tạo chương mới',
      courseId: courseId,
      courseTitle: course.title,
      searchQuery: null,
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/course/:courseId/section/:sectionId/lecture/create', async function(req, res, next) {
  try {
    const { courseId, sectionId } = req.params;
    
    // Verify section belongs to teacher's course
    const section = await database('sections as s')
      .join('courses as c', 's.course_id', 'c.id')
      .where({ 's.id': sectionId, 's.course_id': courseId, 'c.teacher_id': req.user.id })
      .first('s.id', 'c.id as course_id');

    if (!section) {
      return res.status(403).render("403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền tạo bài giảng trong chương này.",
        layout: "main",
      });
    }

    const data = await getCourseSectionInfo(courseId, sectionId);

    if (!data) {
      return res.status(404).render("404", {
        title: "Không tìm thấy khóa học",
        message: "Khóa học không tồn tại.",
        layout: "main",
      });
    }

    res.render('vwTeacher/create-lecture', {
      title: 'Tạo bài giảng mới',
      courseId: courseId,
      sectionId: sectionId,
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

    // Verify course belongs to teacher
    const course = await database('courses')
      .where({ id: courseId, teacher_id: req.user.id })
      .first('id');

    if (!course) {
      return res.status(403).render("403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền chỉnh sửa nội dung khóa học này.",
        layout: "main",
      });
    }

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
        is_preview: foundLecture.is_preview || false,
        duration: foundLecture.duration || 0,
        order_index: foundLecture.order_index || 0
      },
      searchQuery: null,
      layout: 'main'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/teacher/settings', async function(req, res, next) {
  try {
    const teacherId = req.user && req.user.id ? req.user.id : null;
    if (!teacherId) return res.redirect('/signin');

    const settings = await getTeacherSettings(teacherId);

    if (!settings) {
      return res.status(404).render('404', {
        title: 'Không tìm thấy giảng viên',
        message: 'Tài khoản giảng viên không tồn tại.',
        layout: 'main'
      });
    }

    res.render('vwTeacher/settings', {
      title: 'Cài đặt tài khoản',
      ...settings,
      searchQuery: null,
      layout: 'main'
    });
  } catch (err) {
      next(err);
  }
});

router.post('/teacher/settings/profile', async function(req, res, next) {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const { full_name, avatar_url, bio } = req.body;
    const updated = await updateTeacherProfileInfo(teacherId, { full_name, avatar_url, bio });
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Không thể cập nhật thông tin.' });
    }
    res.json({ success: true, message: 'Cập nhật thông tin thành công!', user: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/teacher/settings/password', async function(req, res, next) {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Thiếu mật khẩu.' });
    }

    const result = await updateTeacherPassword(teacherId, current_password, new_password);
    if (!result.ok) {
      const messageMap = {
        INVALID_PASSWORD: 'Mật khẩu hiện tại không đúng.',
        NOT_FOUND: 'Không tìm thấy tài khoản giảng viên.',
        NO_PASSWORD_SET: 'Tài khoản chưa thiết lập mật khẩu.',
      };
      return res.status(400).json({ success: false, message: messageMap[result.code] || 'Không thể đổi mật khẩu.' });
    }

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    next(err);
  }
});

router.post('/teacher/settings/payment', async function(req, res, next) {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const { bank_name, account_number, account_name } = req.body;
    await upsertTeacherPaymentInfo(teacherId, { bank_name, account_number, account_name });

    res.json({ success: true, message: 'Đã lưu thông tin thanh toán.' });
  } catch (err) {
    next(err);
  }
});

router.post('/teacher/settings/preferences', async function(req, res, next) {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const { email_notifications, course_reviews } = req.body;
    await updateTeacherPreferences(teacherId, {
      email_notifications: email_notifications === true || email_notifications === 'true',
      course_reviews: course_reviews === true || course_reviews === 'true',
    });

    res.json({ success: true, message: 'Đã cập nhật tùy chọn giảng dạy.' });
  } catch (err) {
    next(err);
  }
});

router.post('/teacher/courses', async function(req, res, next) {
    try {
        const { title, short_description, detailed_description, thumbnail_url, price, discount_price, category_id, status, sections } = req.body;
        const teacherId = req.user.id;

        // Validation
        if (!title || !short_description || !category_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc!' });
        }

        if (price < 0 || (discount_price !== null && discount_price < 0)) {
            return res.status(400).json({ success: false, message: 'Giá không được là số âm!' });
        }

        if (discount_price !== null && discount_price >= price) {
            return res.status(400).json({ success: false, message: 'Giá khuyến mại phải nhỏ hơn giá gốc!' });
        }

        // Verify category exists
        const category = await database('categories').where({ id: category_id }).first();
        if (!category) {
            return res.status(400).json({ success: false, message: 'Lĩnh vực không tồn tại!' });
        }

        const courseStatus = status || 'draft';
        
        // Start transaction
        const trx = await database.transaction();
        
        try {
            // Insert course
            const [course] = await trx('courses').insert({
                title: title.trim(),
                short_description: short_description.trim(),
                detailed_description: detailed_description || null,
                thumbnail_url: thumbnail_url || null,
                price: parseFloat(price) || 0,
                discount_price: discount_price ? parseFloat(discount_price) : null,
                category_id,
                teacher_id: teacherId,
                status: courseStatus,
                enrollment_count: 0,
                rating_avg: 0,
                rating_count: 0,
                view_count: 0,
                created_at: new Date(),
                last_updated: new Date()
            }).returning('*');

            // Insert sections and lectures if provided
            if (sections && Array.isArray(sections) && sections.length > 0) {
                for (const sectionData of sections) {
                    if (!sectionData.title || !sectionData.title.trim()) continue;
                    
                    const [section] = await trx('sections').insert({
                        course_id: course.id,
                        title: sectionData.title.trim(),
                        order_index: sectionData.order_index || 0,
                        created_at: new Date()
                    }).returning('*');

                    // Insert lectures for this section
                    if (sectionData.lectures && Array.isArray(sectionData.lectures) && sectionData.lectures.length > 0) {
                        for (const lectureData of sectionData.lectures) {
                            // Validation: title and video_url are required
                            if (!lectureData.title || !lectureData.title.trim() || !lectureData.video_url || !lectureData.video_url.trim()) {
                                console.warn('Skipping lecture: missing title or video_url', lectureData);
                                continue;
                            }
                            
                            await trx('lectures').insert({
                                section_id: section.id,
                                title: lectureData.title.trim(),
                                video_url: lectureData.video_url.trim(),
                                duration: parseInt(lectureData.duration) || 0,
                                is_preview: lectureData.is_preview === true || lectureData.is_preview === 'true',
                                order_index: lectureData.order_index || 0,
                                created_at: new Date()
                            });
                        }
                    }
                }
            }

            await trx.commit();
            res.json({ success: true, message: 'Tạo khóa học thành công!', courseId: course.id });
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Create course error:', err);
        res.status(500).json({ success: false, message: err.message || 'Có lỗi xảy ra khi tạo khóa học!' });
    }
});

router.post('/teacher/course/:id', async function(req, res, next) {
    try {
        const { title, short_description, detailed_description, thumbnail_url, price, discount_price, category_id } = req.body;
        const courseId = req.params.id;

        await database('courses')
            .where({ id: courseId, teacher_id: req.user.id })
            .update({
                title,
                short_description,
                detailed_description,
                thumbnail_url,
                price: parseFloat(price),
                discount_price: discount_price ? parseFloat(discount_price) : null,
                category_id,
                last_updated: new Date()
            });

        res.json({ success: true, message: 'Cập nhật khóa học thành công!' });
    } catch (err) {
        next(err);
    }
});

router.delete('/teacher/course/:id', async function(req, res, next) {
    try {
        await database('courses')
            .where({ id: req.params.id, teacher_id: req.user.id })
            .del();

        res.json({ success: true, message: 'Đã xóa khóa học!' });
    } catch (err) {
        next(err);
    }
});

router.post('/teacher/course/:id/sections', async function(req, res, next) {
    try {
        const { title, order_index } = req.body;
        const courseId = req.params.id;

        const course = await database('courses')
            .where({ id: courseId, teacher_id: req.user.id })
            .first();

        if (!course) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
        }

        const [section] = await database('sections').insert({
            course_id: courseId,
            title,
            order_index: order_index || 0,
            created_at: new Date()
        }).returning('*');

        res.json({ success: true, message: 'Tạo chương thành công!', sectionId: section.id });
    } catch (err) {
        next(err);
    }
});

router.post('/teacher/course/:courseId/section/:sectionId/lectures', async function(req, res, next) {
    try {
        const { title, video_url, duration, is_preview, order_index } = req.body;
        const { sectionId, courseId } = req.params;

        // Verify section belongs to teacher's course
        const section = await database('sections as s')
            .join('courses as c', 's.course_id', 'c.id')
            .where({ 's.id': sectionId, 's.course_id': courseId, 'c.teacher_id': req.user.id })
            .first('s.id');

        if (!section) {
            return res.status(403).json({ success: false, message: 'Không có quyền tạo bài giảng trong chương này!' });
        }

        const [lecture] = await database('lectures').insert({
            section_id: sectionId,
            title: title.trim(),
            video_url: video_url?.trim() || '',
            duration: parseInt(duration) || 0,
            is_preview: is_preview === 'true' || is_preview === true,
            order_index: parseInt(order_index) || 0,
            created_at: new Date()
        }).returning('*');

        res.json({ success: true, message: 'Tạo bài giảng thành công!', lectureId: lecture.id });
    } catch (err) {
        console.error('Create lecture error:', err);
        res.status(500).json({ success: false, message: err.message || 'Có lỗi xảy ra khi tạo bài giảng!' });
    }
});

router.delete('/teacher/course/:courseId/section/:sectionId', async function(req, res, next) {
    try {
        // Verify section belongs to teacher's course
        const section = await database('sections as s')
            .join('courses as c', 's.course_id', 'c.id')
            .where({ 's.id': req.params.sectionId, 's.course_id': req.params.courseId, 'c.teacher_id': req.user.id })
            .first('s.id');

        if (!section) {
            return res.status(403).json({ success: false, message: 'Không có quyền xóa chương này!' });
        }

        await database('sections')
            .where({ id: req.params.sectionId })
            .del();

        res.json({ success: true, message: 'Đã xóa chương!' });
    } catch (err) {
        next(err);
    }
});

router.post('/teacher/course/:courseId/lecture/:lectureId', async function(req, res, next) {
    try {
        const { title, video_url, duration, is_preview, order_index } = req.body;
        const { lectureId } = req.params;

        // Verify lecture belongs to teacher's course
        const lecture = await database('lectures as l')
            .join('sections as s', 'l.section_id', 's.id')
            .join('courses as c', 's.course_id', 'c.id')
            .where({ 'l.id': lectureId, 'c.teacher_id': req.user.id })
            .first('l.id');

        if (!lecture) {
            return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa bài giảng này!' });
        }

        const updateData = {
            updated_at: new Date()
        };
        if (title) updateData.title = title;
        if (video_url !== undefined) updateData.video_url = video_url;
        if (duration !== undefined) updateData.duration = parseInt(duration) || 0;
        if (is_preview !== undefined) updateData.is_preview = is_preview === 'true' || is_preview === true;
        if (order_index !== undefined) updateData.order_index = parseInt(order_index) || 0;

        await database('lectures')
            .where({ id: lectureId })
            .update(updateData);

        res.json({ success: true, message: 'Cập nhật bài giảng thành công!' });
    } catch (err) {
        console.error('Update lecture error:', err);
        next(err);
    }
});

router.delete('/teacher/course/:courseId/lecture/:lectureId', async function(req, res, next) {
    try {
        // Verify lecture belongs to teacher's course
        const lecture = await database('lectures as l')
            .join('sections as s', 'l.section_id', 's.id')
            .join('courses as c', 's.course_id', 'c.id')
            .where({ 'l.id': req.params.lectureId, 'c.teacher_id': req.user.id })
            .first('l.id');

        if (!lecture) {
            return res.status(403).json({ success: false, message: 'Không có quyền xóa bài giảng này!' });
        }

        await database('lectures')
            .where({ id: req.params.lectureId })
            .del();

        res.json({ success: true, message: 'Đã xóa bài giảng!' });
    } catch (err) {
        next(err);
    }
});

router.post('/teacher/course/:id/publish', async function(req, res, next) {
    try {
        await database('courses')
            .where({ id: req.params.id, teacher_id: req.user.id })
            .update({ status: 'completed', last_updated: new Date() });

        res.json({ success: true, message: 'Đã xuất bản khóa học!' });
    } catch (err) {
        next(err);
    }
});

export default router;
