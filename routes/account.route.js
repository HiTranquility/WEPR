import express from 'express';

const router = express.Router();

router.get('/signup', (req, res) => {
  res.render('vwAccount/signup', {
    layout: false
  });
});

router.get('/signin', (req, res) => {
  res.render('vwAccount/signin', {
    layout: false
  });
});

router.get('/forgot', (req, res) => {
  res.render('vwAccount/forgot', {
    layout: false
  });
});

export default router;
