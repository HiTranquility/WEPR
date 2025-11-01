import express from 'express';
import { searchCourses, getCourseDetail, getRelatedCourses, getLecturePreview } from '../models/course.model.js';
import { getCategoriesForCourses, getAllCategories, getCategoriesWithChildren, getCategoryWithChildren } from '../models/course-category.model.js';
import database from '../utils/database.js';

const router = express.Router();

router.get('/courses', async (req, res, next) => {
  try {
    const { category, sub, sub_category, subcategory, sort = 'popular', page = '1', limit = '12' } = req.query;
    const subCategory = sub || sub_category || subcategory;

    // 🔥 Nếu người dùng chọn category cha, tự động lấy luôn các sub-category con
    let categoryIds = [];
    if (category) {
      categoryIds = await getCategoryWithChildren(category);
      if (categoryIds.length === 0) {
        categoryIds = [category];
      }
    } else if (subCategory) {
      categoryIds = [subCategory];
    }

    const { data, pagination } = await searchCourses({
      q: '',
      categoryIds, // 👈 truyền mảng ID thay vì 1 cái
      sortBy: sort,
      page: Number(page),
      limit: Number(limit),
    });

    const categories = await getCategoriesWithChildren({ includeCounts: true });

    res.render('vwCourse/list', {
      title: 'Danh sách khóa học',
      courses: data,
      categories,
      query: req.query,
      currentCategory: category || null,
      currentSub: subCategory || null,
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      layout: 'main',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/courses/search', async function (req, res, next) {
  try {
    const { q, category, sub, sub_category, subcategory, sort = 'popular', page = '1', limit = '12', min_price, max_price, only_discounted, featured } = req.query;
    const subCategory = sub || sub_category || subcategory;
    const apiSort = sort === 'price-low' ? 'price_asc' : (sort === 'price-high' ? 'price_desc' : sort);

    const { data, pagination } = await searchCourses({
      q,
      categoryId: category,
      subCategoryId: subCategory,
      sortBy: apiSort,
      page: Number(page),
      limit: Number(limit),
      minPrice: min_price != null ? Number(min_price) : undefined,
      maxPrice: max_price != null ? Number(max_price) : undefined,
      onlyDiscounted: only_discounted === 'true',
      isFeatured: featured ? (featured === 'true') : undefined
    });

    const categories = await getCategoriesWithChildren({ includeCounts: true });
    const allCategories = await getAllCategories({ includeCounts: false });

    res.render('vwCourse/list', {
      title: 'Danh sách khóa học',
      courses: data,
      categories,
      allCategories,
      query: req.query,
      currentCategory: category || null,
      currentSub: subCategory || null,
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      sortBy: sort,
      searchQuery: q,
      q,
      layout: 'main'
    });
  } catch (err) {
    next(err);
  }
});

// router.get("/courses/detail", async function (req, res, next) {
//   try {

//     const { id } = req.query;

//     if (!id) {
//       return res.status(400).render("404", {
//         title: "Lỗi truy cập",
//         message: "Thiếu ID khóa học trong yêu cầu.",
//         layout: "main",
//       });
//     }

//     const course = await getCourseDetail(Number(id));

//     if (!course) {
//       return res.status(404).render("404", {
//         title: "Không tìm thấy khóa học",
//         message: "Khóa học bạn yêu cầu không tồn tại hoặc đã bị xóa.",
//         layout: "main",
//       });
//     }

//     res.render("vwCourse/detail", {
//       title: course.title || "Chi tiết khóa học",
//       course, 
//       layout: false, 
//     });
//   } catch (err) {
//     next(err);
//   }
// });            

router.get('/courses/:id', async function (req, res, next) {
  try {
    const course = await getCourseDetail(req.params.id);
    if (!course) return res.redirect('/404');

    const relatedCourses = course.category?.id
      ? await getRelatedCourses(course.id, course.category.id, 6)
      : [];

    const allCategories = await getAllCategories({ includeCounts: false });

    res.render('vwCourse/detail', {
      title: course.title,
      course,
      relatedCourses,
      reviews: [],
      isEnrolled: false,
      isInWatchlist: false,
      allCategories,
      searchQuery: null,
      layout: 'main'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/courses/:courseId/preview/lecture/:lectureId', async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;
    const data = await getLecturePreview(courseId, lectureId);

    if (!data) {
      return res.status(404).render('vwCommon/404', {
        layout: 'error',
        title: 'Không tìm thấy bài giảng',
        bodyClass: 'error-404'
      });
    }

    res.render('vwCourse/preview', {
      layout: false,
      title: `Preview: ${data.lecture_title}`,
      lecture: {
        id: data.lecture_id,
        title: data.lecture_title,
        video_url: data.video_url,
        duration: data.duration,
      },
      section: {
        id: data.section_id,
        title: data.section_title,
      },
      course: {
        id: data.course_id,
        title: data.course_title,
        teacher: {
          full_name: data.teacher_name,
          avatar_url: data.teacher_avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/courses/:id/enroll', function (req, res) {
  if (!req.user) {
    return res.redirect('/signin');
  }

  if (req.user.role !== 'student') {
    return;
  }

  res.json({ success: true, message: 'Đã đăng ký khóa học thành công!' });
});

router.post('/courses/:id/wishlist', function (req, res) {
  if (!req.user) {
    return res.redirect('/signin');
  }

  if (req.user.role !== 'student') {
    return;
  }

  res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích!' });
});

router.delete('/courses/:id/wishlist', function (req, res) {
  res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích!' });
});

router.post('/courses/:id/reviews', function (req, res) {
  res.json({ success: true, message: 'Đã gửi đánh giá thành công!' });
});

export default router;