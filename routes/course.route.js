import express from 'express';
import { searchCourses, getCourseDetail, getRelatedCourses } from '../models/course.model.js';
import { getCategoriesForCourses, getAllCategories } from '../models/course-category.model.js';

const router = express.Router();

router.get('/courses', async function(req, res, next) {
    try {
        const { q, category, sort = 'popular', page = '1', limit = '12', min_price, max_price, only_discounted, featured } = req.query;
        const apiSort = sort === 'price-low' ? 'price_asc' : (sort === 'price-high' ? 'price_desc' : sort);

        const { data, pagination } = await searchCourses({
            q,
            categoryId: category,
            sortBy: apiSort,
            page: Number(page),
            limit: Number(limit),
            minPrice: min_price != null ? Number(min_price) : undefined,
            maxPrice: max_price != null ? Number(max_price) : undefined,
            onlyDiscounted: only_discounted === 'true',
            isFeatured: featured === 'true'
        });

        const categories = await getAllCategories({ includeCounts: true });

        res.render('vwCourse/list', {
            title: 'Danh sách khóa học',
            courses: data,
            categories,
            currentCategory: category || null,
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

router.get('/courses/:id', async function(req, res, next) {
    try {
        const course = await getCourseDetail(req.params.id);
        if (!course) return res.redirect('/404');

        const relatedCourses = course.category?.id
            ? await getRelatedCourses(course.id, course.category.id, 6)
            : [];

        // TODO: reviews, sections... khi có schema tương ứng
        res.render('vwCourse/detail', {
            title: course.title,
            course,
            relatedCourses,
            reviews: [],
            isEnrolled: false,
            isInWatchlist: false,
            layout: 'main'
        });
    } catch (err) {
        next(err);
    }
});

router.get('/courses/:id/preview/:lectureId', function(req, res) {
    const mockLecture = {
        id: req.params.lectureId,
        title: 'Introduction to Course',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        description: 'Welcome to the course! In this lecture, we will introduce you to the course content.',
        duration: '10:30'
    };

    const mockCourse = {
        id: req.params.id,
        title: 'Complete Python Bootcamp',
        teacher: {
            full_name: 'Jose Portilla',
            avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
        }
    };

    res.render('vwCourse/preview', {
        layout: false,
        title: 'Preview Lecture',
        lecture: mockLecture,
        course: mockCourse
    });
});

router.get('/search', function(req, res) {
    const searchQuery = req.query.q || '';
    const mockResults = [
        {
            id: 1,
            title: 'Complete Python Bootcamp',
            short_description: 'Learn Python from scratch',
            thumbnail_url: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
            rating_avg: 4.6,
            rating_count: 4789,
            discount_price: 499000,
            enrollment_count: 42567,
            category: { name: 'Lập trình' },
            teacher: {
                full_name: 'Jose Portilla',
                avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
            }
        }
    ];

    res.render('vwCourse/list', {
        title: `Kết quả tìm kiếm: ${searchQuery}`,
        courses: mockResults,
        categories: [],
        searchQuery: searchQuery,
        currentPage: 1,
        totalPages: 1,
        sortBy: 'popular',
        layout: 'main'
    });
});

router.post('/courses/:id/enroll', function(req, res) {
    res.json({ success: true, message: 'Đã đăng ký khóa học thành công!' });
});

router.post('/courses/:id/watchlist', function(req, res) {
    res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích!' });
});

router.delete('/courses/:id/watchlist', function(req, res) {
    res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích!' });
});

router.post('/courses/:id/reviews', function(req, res) {
    res.json({ success: true, message: 'Đã gửi đánh giá thành công!' });
});

export default router;