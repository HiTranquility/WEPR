import express from 'express';
import { homeQueries } from '../models/course.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try 
    {
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
            title: 'Online Academy - Learn Anytime, Anywhere',
            layout: 'main'
        });
    } catch (error) {
        console.error('Error loading landing page:', error);
        res.status(500).render('vwCommon/500', { layout: 'error', title: '500 - Internal Server Error', bodyClass: 'error-500' });
    }
});

router.get('/403', (req, res) => {
    res.render('vwCommon/403', {
        layout: 'error',
        title: '403 - Access Denied',
        bodyClass: 'error-403'
    });
});

router.get('/404', (req, res) => {
    res.render('vwCommon/404', {
        layout: 'error',
        title: '404 - Page Not Found',
        bodyClass: 'error-404'
    });
});

router.get('/500', (req, res) => {
    res.render('vwCommon/500', {
        layout: 'error',
        title: '500 - Internal Server Error',
        bodyClass: 'error-500'
    });
});

router.get('/400', (req, res) => {
    res.render('vwCommon/400', {
        layout: 'error',
        title: '400 - Bad Request',
        bodyClass: 'error-400'
    });
});

router.get('/405', (req, res) => {
    res.render('vwCommon/405', {
        layout: 'error',
        title: '405 - Method Not Allowed',
        bodyClass: 'error-405'
    });
});

export default router;