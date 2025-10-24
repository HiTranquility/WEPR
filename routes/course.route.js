import express from 'express';
import { readCourse } from '../models/course.model.js';

const router = express.Router();

router.get('/courses/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).render('vwCourse/400', { layout: false });
        }
        const course = await readCourse(req.params.id);
        if (!course) {
            return res.status(404).render('vwCourse/404', { layout: false });
        }
        res.render('vwCourse/detail', {
            course: {
                id: course.id,
                title: course.title,
                short_description: course.short_description,
                thumbnail_url: course.thumbnail_url,
                price: course.price,
                discount_price: course.discount_price,
                status: course.status,
            },
            layout: 'main'
        });
    } catch (error) {
        console.error('Error loading course detail:', error);
        res.status(500).render('vwCourse/500', { layout: false });
    }
});

export default router;