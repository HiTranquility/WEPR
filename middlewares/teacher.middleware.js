import { verifyAccessToken } from "../utils/jwt.js";
import { getUserPublicById } from "../models/user.model.js";

export async function ensureAuthenticated(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!req.user || !req.user.role) {
      if (!token) return res.redirect("/signin");
      const decoded = verifyAccessToken(token);
      console.log('[TEACHER] decoded from JWT:', decoded);
      const dbUser = await getUserPublicById(decoded.id);
      console.log('[TEACHER] dbUser loaded:', dbUser && { id: dbUser.id, role: dbUser.role, email: dbUser.email });
      if (!dbUser) return res.redirect("/signin");
      req.user = dbUser;
      res.locals.user = dbUser;
      return next();
    }
    console.log('[TEACHER] req.user present:', { id: req.user.id, role: req.user.role });
    if (!res.locals.user) res.locals.user = req.user;
    return next();
  } catch (err) {
    console.log('[TEACHER] ensureAuthenticated error:', err?.message);
    return res.redirect("/signin");
  }
}

export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const userRole = (req.user && req.user.role ? String(req.user.role) : '').toLowerCase();
    const allowed = allowedRoles.map(r => String(r).toLowerCase());
    console.log('[TEACHER] requireRole check:', { userRole, allowed });
    if (userRole && allowed.includes(userRole)) {
      return next();
    }
    return res.status(403).render("vwCommon/403", { layout: false });
  };
}
