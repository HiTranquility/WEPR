import express from 'express';

const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('vwAuth/signup', {
        layout: 'auth',
        title: 'Sign Up - Online Academy'
    });
});

router.get('/signin', (req, res) => {
    res.render('vwAuth/signin', {
        layout: 'auth',
        title: 'Sign In - Online Academy'
    });
});

router.get('/forgot', (req, res) => {
    res.render('vwAuth/forgot', {
        layout: 'auth',
        title: 'Forgot Password - Online Academy'
    });
});

router.get('/reset', (req, res) => {
    res.render('vwAuth/reset', {
        layout: 'auth',
        title: 'Reset Password - Online Academy'
    });
});

export default router;
