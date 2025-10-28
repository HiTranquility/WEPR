import jwt from "jsonwebtoken";

const {
  JWT_ACCESS_SECRET = "dev_access_secret_change_me",
  JWT_REFRESH_SECRET = "dev_refresh_secret_change_me",
  JWT_ACCESS_EXPIRES = "10m",
  JWT_REFRESH_EXPIRES = "7d"
} = process.env;

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
}
export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
}
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
