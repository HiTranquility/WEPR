import express from 'express';
import { homeQueries } from '../models/home.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [featuredCourses, mostViewedCourses, newestCourses, topCategories, allCategories] = await Promise.all([
      homeQueries.getFeaturedCourses(),
      homeQueries.getMostViewedCourses(),
      homeQueries.getNewestCourses(),
      homeQueries.getTopCategoriesByEnrollments(),
      homeQueries.getCategoriesWithChildren()
    ]);

    res.render('vwCommon/landing', {
      featuredCourses,
      mostViewedCourses,
      newestCourses,
      topCategories,
      allCategories,
      title: 'Online Academy - Learn Anytime, Anywhere'
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
