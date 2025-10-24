import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import commonRoute from './routes/common.route.js';
import accountRoute from './routes/account.route.js';
import courseRoute from './routes/course.route.js';
import studentRoute from './routes/student.route.js';
import teacherRoute from './routes/teacher.route.js';
import adminRoute from './routes/admin.route.js';

const app = express();
const __dirname = import.meta.dirname;

//App Configuration
app.engine('handlebars',engine ({
    partialsDir: __dirname + '/views/partials',
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
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

//Routes and Static Files Configuration
app.use('/statics', express.static('statics'));

//Server Routes
app.use('/', commonRoute);
app.use('/', accountRoute);
app.use('/', courseRoute);
app.use('/', studentRoute);
app.use('/', teacherRoute);
app.use('/', adminRoute);

//Error
app.use(function(req, res, next) {
    res.status(404).render('vwCommon/404', { layout: false });
});
app.use(function(req, res, next) {
    res.status(403).render('vwCommon/403', { layout: false });
});

//Server Configuration
app.listen(process.env.APP_PORT || 3000, function() {
	console.log('Server is running on port ' + (process.env.APP_PORT || 3000));
});
