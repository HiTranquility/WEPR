export function ensureAuthenticated(req, res, next) {
    // Works with Passport (req.isAuthenticated) or any middleware that sets req.user
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
      return next();
    }
  
    if (req.user) {
      return next();
    }
  
    return res.redirect('/signin');
  }
  
  export function requireRole(...allowedRoles) {
    return function roleGuard(req, res, next) {
      const userRole = req.user && req.user.role;
      if (userRole && allowedRoles.includes(userRole)) {
        return next();
      }
      return res.status(403).render('vwCommon/403', { layout: false });
    };
  }
  
  