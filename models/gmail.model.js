// models/gmail.model.js
import database from "../utils/database.js";
import bcrypt from "bcrypt";

/** Kiểm tra email tồn tại */
export async function checkUserExistsByEmail(email) {
  if (!email) return null;
  return await database("users").where("email", email).select("id").first();
}

/** Tạo user mới từ Gmail signup */
export async function createGmailUser({ email, password, role = "student" }) {
  if (!email || !password) throw new Error("Missing email or password");

  const existing = await checkUserExistsByEmail(email);
  if (existing) {
    const err = new Error("Email already exists");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  const newUserData = {
    full_name: email.split("@")[0],
    email,
    password_hash: hashed,
    role,
  };

  const [newUser] = await database("users").insert(newUserData).returning("*");
  return newUser;
}

/** Lấy user để xác thực */
export async function getUserByEmailForAuth(email) {
  if (!email) return null;
  return await database("users")
    .where("email", email)
    .select("id", "full_name", "email", "role", "password_hash")
    .first();
}

/** Xác thực password */
export async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) return false;
  return await bcrypt.compare(password, passwordHash);
}

/** JWT Payload */
export function buildAuthPayload(user) {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    name: user.full_name,
    email: user.email,
  };
}

/** Lấy dashboard redirect theo role */
export function getDashboardRedirectByRole(role) {
  const map = {
    admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
    student: "/student/dashboard",
  };
  return map[role] || "/";
}
