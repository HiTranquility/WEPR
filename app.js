import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';

const app = express();
const __dirname = import.meta.dirname;

//App Configuration
app.engine('handlebars',engine ({
    helpers: {
        fill_section: hbs_sections(),
        formatNumber(value) {
            return new Intl.NumberFormat('en-US').format(value);
        },
        eq(a,b) { 
            return a === b;
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

//Routes and Static Files Configuration
app.use('/static', express.static('static'));

//Error Routes
app.use(function(req, res, next) {
    res.status(404).render('vwCommon/404');
});
app.use(function(req, res, next) {
    res.status(403).render('vwCommon/403');
});

//Server Routes
app.use('/', routes);
app.use('/admin', adminRoutes);

//Server Configuration
app.listen(3000, function() {
    console.log('Server is running on port 3000');
});