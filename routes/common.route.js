import express from 'express';
import {
  getLandingData,
  getTop3FeaturedCoursesThisWeek,
  getTop10MostViewedCourses,
  getTop10NewestCourses,
  getTop5CategoriesByEnrollmentsThisWeek
} from "../models/course.model.js";
import { getAllCategories } from '../models/course-category.model.js';

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const allCategories = await getAllCategories({ includeCounts: false });

    const [
      top3Featured,
      top10Viewed,
      top10Newest,
      top5Categories
    ] = await Promise.all([
      getTop3FeaturedCoursesThisWeek(),
      getTop10MostViewedCourses(),
      getTop10NewestCourses(),
      getTop5CategoriesByEnrollmentsThisWeek()
    ]);

    res.render("vwCommon/landing", {
      featuredCoursesWeek: top3Featured,
      mostViewedCourses: top10Viewed,
      newestCourses: top10Newest,
      topCategories: top5Categories,
      allCategories,
      searchQuery: null,
      title: "Online Academy - Learn Anytime, Anywhere",
      layout: "main",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/about-us', async function (req, res) {
    const allCategories = await getAllCategories({ includeCounts: false });
    res.render('vwCommon/about-us', {
        title: 'Về chúng tôi',
        allCategories,
        searchQuery: null,
        layout: 'main'
    });
});

router.get('/contact-us', async function (req, res) {
    const allCategories = await getAllCategories({ includeCounts: false });
    res.render('vwCommon/contact-us', {
        title: 'Liên hệ',
        layout: 'main',
        isSent: false
    });
});

router.get('/privacy', async function (req, res) {
    const allCategories = await getAllCategories({ includeCounts: false });
    res.render('vwCommon/privacy', {
        title: 'Chính sách bảo mật',
        allCategories,
        searchQuery: null,
        layout: 'main'
    });
});

router.get('/terms', async function (req, res) {
    const allCategories = await getAllCategories({ includeCounts: false });
    res.render('vwCommon/terms', {
        title: 'Điều khoản sử dụng',
        allCategories,
        searchQuery: null,
        layout: 'main'
    });
});

router.get('/404', (req, res) => {
    res.status(404).render('vwCommon/404', { layout: 'error', title: '404 - Page Not Found', bodyClass: 'error-404' });
});
router.get('/500', (req, res) => {
    res.status(500).render('vwCommon/500', { layout: 'error', title: '500 - Internal Server Error', bodyClass: 'error-500' });
});
router.get('/403', (req, res) => {
    res.status(403).render('vwCommon/403', { layout: 'error', title: '403 - Access Denied', bodyClass: 'error-403' });
});
router.get('/400', (req, res) => {
    res.status(400).render('vwCommon/400', { layout: 'error', title: '400 - Bad Request', bodyClass: 'error-400' });
});

router.post('/contact-us', function (req, res) {
    res.render('vwCommon/contact-us', {
        title: 'Liên hệ',
        layout: 'main',
        isSent: true
    });
});

export default router;
