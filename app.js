import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import authRoute from './routes/auth.route.js';
import studentRoute from './routes/student.route.js';
import teacherRoute from './routes/teacher.route.js';
import adminRoute from './routes/admin.route.js';
import commonRoute from './routes/common.route.js';
import courseRoute from './routes/course.route.js';
import { hbsHelpers } from './utils/hbsHelpers.js';
const app = express();
const __dirname = import.meta.dirname;

//App Configuration
app.engine('handlebars', engine({
    partialsDir: __dirname + '/views/partials',
    helpers: hbsHelpers
}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

//Routes and Static Files Configuration
app.use('/statics', express.static('statics'));

//Global Middleware
app.use(express.urlencoded({ extended: true }));

//Server Routes
app.use('/', authRoute);
app.use('/', studentRoute);
app.use('/', teacherRoute);
app.use('/', adminRoute);
app.use('/', commonRoute);
app.use('/', courseRoute);

app.use((req, res) => res.redirect('/404'));

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
app.listen(process.env.APP_PORT || 3000, function () {
    console.log('Server is running on port ' + (process.env.APP_PORT || 3000));
});
