import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import session from 'express-session';
import cookieParser from "cookie-parser";
import authRoute from './routes/auth.route.js';
import studentRoute from './routes/student.route.js';
import teacherRoute from './routes/teacher.route.js';
import adminRoute from './routes/admin.route.js';
import commonRoute from './routes/common.route.js';
import courseRoute from './routes/course.route.js';
import gmailRoute from './routes/gmail.route.js';
import { hbsHelpers } from './utils/hbsHelpers.js';
import passport from './utils/passport.js';
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from './utils/jwt.js';
import { hasRefreshToken } from './utils/token-store.js';
import globalCategories from './middlewares/globalCategories.js';
const app = express();
const rootDir = process.cwd();
const viewsRoot = path.resolve(rootDir, 'views');
const staticsRoot = path.resolve(rootDir, 'statics');
const __dirname = import.meta.dirname;

//App Configuration
app.engine('handlebars', engine({
  partialsDir: __dirname + '/views/partials',
  helpers: {
    ...hbsHelpers,
    fill_section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    },
    section: function (name) {
      return this._sections && this._sections[name] ? this._sections[name] : '';
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
// Hydrate req.user from JWT cookies and refresh access token if needed
app.use((req, res, next) => {
  const access = req.cookies?.access_token;
  if (access) {
    try {
      const payload = verifyAccessToken(access);
      req.user = payload;
      res.locals.user = payload;
      return next();
    } catch (err) {
      // fallthrough to refresh flow
    }
  }

  // Attempt refresh if refresh_token is available
  try {
    const refresh = req.cookies?.refresh_token;
    if (!refresh) return next();
    const payload = verifyRefreshToken(refresh);
    if (!payload?.id || !hasRefreshToken(payload.id, refresh)) return next();

    const newAccess = signAccessToken({ id: payload.id, role: payload.role, name: payload.name, email: payload.email });
    res.cookie('access_token', newAccess, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 });
    req.user = { id: payload.id, role: payload.role, name: payload.name, email: payload.email };
    res.locals.user = req.user;
  } catch (_) {
    // ignore refresh errors
  }
  next();
});
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

//Google OAuth Middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Provide category tree for header/menus
app.use(globalCategories);

// Ensure req.user has role and expose to views
// Remove global role-filling; handled in per-role middlewares

//Server Routes
app.use('/', authRoute);
app.use('/', studentRoute);
app.use('/', teacherRoute);
app.use('/', adminRoute);
app.use('/', commonRoute);
app.use('/', courseRoute);
app.use('/', gmailRoute);

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
