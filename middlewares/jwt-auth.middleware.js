import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";

// Middleware đọc token và gắn req.user
export function attachUserFromToken(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;
    res.locals.user = decoded; // để hiển thị trên Handlebars
  } catch (err) {
    // token hết hạn hoặc lỗi -> không gắn user, để các middleware khác xử lý
  }

  next();
}
