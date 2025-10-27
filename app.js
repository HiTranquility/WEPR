import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import path from 'path';
import session from 'express-session';
import passport from './middlewares/passport.js';
import cookieParser from "cookie-parser";
import { attachUserFromToken } from "./middlewares/jwt-auth.middleware.js";
import authRoute from './routes/auth.route.js';
import studentRoute from './routes/student.route.js';
import teacherRoute from './routes/teacher.route.js';
import adminRoute from './routes/admin.route.js';
import commonRoute from './routes/common.route.js';
import courseRoute from './routes/course.route.js';
const app = express();
const rootDir = process.cwd();
const viewsRoot = path.resolve(rootDir, 'views');
const staticsRoot = path.resolve(rootDir, 'statics');

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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(attachUserFromToken);

//Google OAuth Middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

//Server Routes
app.use('/', authRoute);
app.use('/student', studentRoute);
app.use('/teacher', teacherRoute);
app.use('/admin', adminRoute);
app.use('/', commonRoute);
app.use('/', courseRoute);

app.use((req, res) => {
  console.log(`[404] Missed: ${req.method} ${req.originalUrl}`);
  res.status(404).render('vwCommon/404', { layout: 'error', title: '404 - Page Not Found', bodyClass: 'error-404' });
});

// Middleware lỗi (4 tham số) – đặt CUỐI CÙNG
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;

  // API/JSON
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ error: status, message: err.message || 'Internal Server Error' });
  }

  // Pages
  if (status === 404) return res.redirect('/404');
  if (status === 403) return res.redirect('/403');
  if (status >= 500) return res.redirect('/500');

  return res.redirect('/400');
});
//Server Configuration
if (!process.env.NETLIFY) {
    app.listen(process.env.APP_PORT || 3000, function() {
		console.log('Server is running on port ' + (process.env.APP_PORT || 3000));
	});
}

export default app;
