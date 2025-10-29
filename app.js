import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import { getLandingData } from "./models/course.model.js";

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
import gmailRoute from './routes/gmail.route.js';
import { hbsHelpers } from './utils/hbsHelpers.js';
const app = express();
const rootDir = process.cwd();
const viewsRoot = path.resolve(rootDir, 'views');
const staticsRoot = path.resolve(rootDir, 'statics');
const __dirname = import.meta.dirname;

//App Configuration
app.engine('handlebars', engine({
    partialsDir: __dirname + '/views/partials',
    helpers: hbsHelpers
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

// Fix treo fetch (do connection không close)
app.use((req, res, next) => {
  res.setHeader("Connection", "close"); // buộc đóng socket sau mỗi response
  next();
});


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
app.use('/gmail', gmailRoute);

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
