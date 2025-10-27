// middlewares/student.middleware.js
import jwt from 'jsonwebtoken';  
import getToken, { JWT_SECRET, SAFE_METHODS } from '../utils/jwt.js';

export function ensureAuthenticated(req, res, next) {
  const token = getToken(req);
  if (!token) return res.redirect('/signin');

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    return next();
  } catch {
    return res.redirect('/signin');
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (role && roles.includes(role)) return next();
    return res.status(403).render('vwCommon/403', { layout: false });
  };
}

// Middleware riêng của student (độc lập)
export const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  return res.status(403).render('vwCommon/403', { layout: false });
};

// Chỉ siết với method ghi
export const studentWriteOnly = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) return next();
  const token = getToken(req);
  if (!token) return res.redirect('/signin');

  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role !== 'student') return res.status(403).render('vwCommon/403', { layout: false });
    req.user = user;
    return next();
  } catch {
    return res.redirect('/signin');
  }
};