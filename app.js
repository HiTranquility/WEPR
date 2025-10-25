import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoute from './routes/auth.route.js';
import studentRoute from './routes/student.route.js';
import teacherRoute from './routes/teacher.route.js';
import adminRoute from './routes/admin.route.js';
import commonRoute from './routes/common.route.js';
import courseRoute from './routes/course.route.js';
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isNetlify = !!process.env.NETLIFY;
const viewsRoot = isNetlify ? path.resolve(process.cwd(), 'views') : path.resolve(__dirname, 'views');
const staticsRoot = isNetlify ? path.resolve(process.cwd(), 'statics') : path.resolve(__dirname, 'statics');

//App Configuration
app.engine('handlebars',engine ({
    partialsDir: `${viewsRoot}/partials`,
    helpers: {
        fill_section: hbs_sections(),
        formatNumber(value) {
            return new Intl.NumberFormat('vi-VN').format(value);
        },
        formatCurrency(value) {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
        },
        eq(a,b) {
            return a === b;
        },
        gt(a, b) {
            return a > b;
        },
        calculateDiscount(price, discountPrice) {
            if (!discountPrice || discountPrice >= price) return 0;
            return Math.round(((price - discountPrice) / price) * 100);
        },
        isNew(createdAt) {
            const daysSinceCreation = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
            return daysSinceCreation < 7;
        },
        isBestSeller(enrollmentCount) {
            return enrollmentCount > 1000;
        },
        truncate(str, length) {
            if (!str || str.length <= length) return str;
            return str.substring(0, length) + '...';
        },
        formatDate(date) {
            if (!date) return '';
            return new Intl.DateTimeFormat('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(new Date(date));
        },
        repeat(count) {
            let result = '';
            for (let i = 0; i < count; i++) {
                result += '⭐';
            }
            return result;
        },
        lt(a, b) {
            return a < b;
        },
        ne(a, b) {
            return a !== b;
        },
        math(lvalue, operator, rvalue) {
            const left = Number(lvalue);
            const right = Number(rvalue);
            switch (operator) {
                case '+':
                    return left + right;
                case '-':
                    return left - right;
                case '*':
                    return left * right;
                case '/':
                    return right !== 0 ? left / right : 0;
                default:
                    return 0;
            }
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', viewsRoot);

//Routes and Static Files Configuration
app.use('/statics', express.static(staticsRoot));

//Global Middleware

//Server Routes
app.use('/', authRoute);
app.use('/', studentRoute);
app.use('/', teacherRoute);
app.use('/', adminRoute);
app.use('/', commonRoute);
app.use('/', courseRoute);

// Explicit error routes (must be before 404 catch-all
app.get('/400', (req, res) => {
    res.status(400).render('vwCommon/400', { layout: 'error', title: '400 - Bad Request', bodyClass: 'error-400' });
});
app.get('/403', (req, res) => {
    res.status(403).render('vwCommon/403', { layout: 'error', title: '403 - Access Denied', bodyClass: 'error-403' });
});
app.get('/404', (req, res) => {
    res.status(404).render('vwCommon/404', { layout: 'error', title: '404 - Page Not Found', bodyClass: 'error-404' });
});
app.get('/405', (req, res) => {
    res.status(405).render('vwCommon/405', { layout: 'error', title: '405 - Method Not Allowed', bodyClass: 'error-405' });
});
app.get('/500', (req, res) => {
    res.status(500).render('vwCommon/500', { layout: 'error', title: '500 - Internal Server Error', bodyClass: 'error-500' });
});
// 404 catch-all
app.use((req, res) => {
    res.status(404).render('vwCommon/404', { layout: 'error', title: '404 - Page Not Found', bodyClass: 'error-404' });
});

// Generic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).render('vwCommon/500', { layout: 'error', title: '500 - Internal Server Error', bodyClass: 'error-500' });
});
//Server Configuration
if (!process.env.NETLIFY) {
    app.listen(process.env.APP_PORT || 3000, function() {
		console.log('Server is running on port ' + (process.env.APP_PORT || 3000));
	});
}

export default app;
