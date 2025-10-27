// utils/jwt.js
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
export const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', ...opts });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default function getToken(req) {
  return (
    (req.cookies && (req.cookies.access_token || req.cookies.accessToken)) ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  );
}