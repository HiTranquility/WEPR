import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import homeRoute from './routes/home.route.js';

const app = express();
const __dirname = import.meta.dirname;

//App Configuration
app.engine('handlebars',engine ({
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
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

//Routes and Static Files Configuration
app.use('/static', express.static('statics'));

//Server Routes
app.use('/', homeRoute);

//Error Routes
app.use(function(req, res, next) {
    res.status(404).render('vwCommon/404');
});
app.use(function(req, res, next) {
    res.status(403).render('vwCommon/403');
});

//Server Configuration
app.listen(process.env.APP_PORT || 3000, function() {
	console.log('Server is running on port ' + (process.env.APP_PORT || 3000));
});