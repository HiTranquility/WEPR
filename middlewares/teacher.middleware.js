import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";

export function ensureAuthenticated(req, res, next) {
  console.log("[TEACHER] ensureAuthenticated running for", req.originalUrl);
  console.log("[TEACHER] req.user =", req.user);
  const token = req.cookies?.access_token;
  console.log("[TEACHER] cookie token =", token ? "found" : "missing");

  if (req.user) return next();
  if (!token) return res.redirect("/signin");

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    console.log("[TEACHER] decoded =", decoded);
    req.user = decoded;
    res.locals.user = decoded;
    return next();
  } catch (err) {
    console.log("[TEACHER] token invalid:", err.message);
    return res.redirect("/signin");
  }
}

export function requireRole(...allowedRoles) {
  console.log("[TEACHER] requireRole running. allowed =", allowedRoles);
  return function roleGuard(req, res, next) {
    console.log("[TEACHER] user role =", req.user?.role);
    const userRole = req.user && req.user.role;
    if (userRole && allowedRoles.includes(userRole)) {
      console.log("[TEACHER] role OK");
      return next();
    }
    console.log("[TEACHER] role FAIL");
    return res.status(403).render("vwCommon/403", { layout: false });
  };
}
