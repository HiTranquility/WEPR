import database from "../utils/database.js";
import bcrypt from "bcrypt";

//=================
// GMAIL AUTH MODEL
//=================

/**
 * Kiểm tra email đã tồn tại trong hệ thống chưa
 * @param {string} email - Email cần kiểm tra
 * @returns {Promise<Object|null>} User object nếu tồn tại, null nếu không
 */
export async function checkUserExistsByEmail(email) {
  if (!email) return null;
  return await database("users").where("email", email).select("id").first();
}

/**
 * Tạo user mới thông qua Gmail signup
 * @param {Object} userData - Dữ liệu user: { email, password, role }
 * @returns {Promise<Object>} User object đã tạo
 */
export async function createGmailUser({ email, password, role = "student" }) {
  if (!email || !password) {
    const err = new Error("Missing email or password");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // Kiểm tra email đã tồn tại
  const existing = await checkUserExistsByEmail(email);
  if (existing) {
    const err = new Error("Email already exists");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  // Tạo user mới
  const userData = {
    full_name: email.split("@")[0],
    email: email,
    password_hash: hashed,
    role: role || "student",
  };

  const [newUser] = await database("users").insert(userData).returning("*");
  return newUser;
}

/**
 * Lấy user theo email kèm password_hash để xác thực
 * @param {string} email - Email của user
 * @returns {Promise<Object|null>} User object với password_hash
 */
export async function getUserByEmailForAuth(email) {
  if (!email) return null;
  return await database("users")
    .where("email", email)
    .select("id", "full_name", "email", "role", "password_hash")
    .first();
}

/**
 * Xác thực password
 * @param {string} password - Password gốc
 * @param {string} passwordHash - Password đã hash
 * @returns {Promise<boolean>} true nếu đúng, false nếu sai
 */
export async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) return false;
  return await bcrypt.compare(password, passwordHash);
}

/**
 * Tạo payload cho JWT token
 * @param {Object} user - User object
 * @returns {Object} Payload cho JWT
 */
export function buildAuthPayload(user) {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    name: user.full_name,
    email: user.email,
  };
}

/**
 * Lấy redirect URL theo role
 * @param {string} role - Role của user (admin, teacher, student)
 * @returns {string} Redirect URL
 */
export function getDashboardRedirectByRole(role) {
  const map = {
    admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
    student: "/student/dashboard",
  };
  return map[role] || "/";
}

