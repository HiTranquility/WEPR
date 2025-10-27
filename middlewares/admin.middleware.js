import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret";

// ✅ Middleware kiểm tra đăng nhập
export function ensureAuthenticated(req, res, next) {
  console.log("[ADMIN] ensureAuthenticated running for", req.originalUrl);
  console.log("[ADMIN] req.user =", req.user);
  const token = req.cookies?.access_token;
  console.log("[ADMIN] cookie token =", token ? "found" : "missing");

  if (req.user) return next();
  if (!token) return res.redirect("/signin");

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    console.log("🧩 decoded =", decoded);
    req.user = decoded;
    res.locals.user = decoded;
    return next();
  } catch (err) {
    console.log("🧩 token invalid:", err.message);
    return res.redirect("/signin");
  }
}

export function requireRole(...allowedRoles) {
  console.log("[ADMIN] requireRole running. allowed =", allowedRoles);
  return function roleGuard(req, res, next) {
    console.log("[ADMIN] user role =", req.user?.role);
    const userRole = req.user && req.user.role;
    if (userRole && allowedRoles.includes(userRole)) {
      console.log("[ADMIN] role OK");
      return next();
    }
    console.log("[ADMIN] role FAIL");
    return res.status(403).render("vwCommon/403", { layout: false });
  };
}

