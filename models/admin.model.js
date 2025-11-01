import database from '../utils/database.js';
//=================
// ADMINS - CRUD
//=================

export const createAdmin = async (admin) => {
  admin.role = "admin";
  return await baseQuery.insert(admin).returning("*");
};

export const readAdmin = async (id) => {
  return await baseQuery.where({ id, role: "admin" }).first();
};

export const updateAdmin = async (id, data) => {
  return await baseQuery.where({ id, role: "admin" }).update(data).returning("*");
};

export const deleteAdmin = async (id) => {
  return await baseQuery.where({ id, role: "admin" }).del();
};

export const getAllAdmins = async () => {
  return await baseQuery
    .clone()
    .where("role", "admin")
    .select("id", "full_name", "email", "avatar_url", "created_at", "status")
    .orderBy("id", "asc");
};

//=================
// ADMIN - CATEGORIES MANAGEMENT
//=================

// 🔹 Lấy tất cả lĩnh vực (kèm số lượng khóa học)
export const getAllAdminCategories = async () => {
  const rows = await database("categories AS cat")
    .leftJoin("courses AS c", "cat.id", "c.category_id")
    .groupBy("cat.id")
    .select(
      "cat.id",
      "cat.name",
      "cat.description",
      "cat.created_at",
      database.raw("COUNT(c.id) AS course_count")
    )
    .orderBy("cat.created_at", "asc");

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    course_count: Number(r.course_count || 0),
    created_at: r.created_at,
  }));
};

//=================
// ADMIN - COURSES MANAGEMENT
//=================

export const getAllAdminCourses = async () => {
  const rows = await database("courses AS c")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .select(
      "c.id",
      "c.title",
      "c.thumbnail_url",
      "c.discount_price",
      "c.status",
      "c.rating_avg",
      "c.rating_count",
      "c.enrollment_count",
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_full_name")
    )
    .orderBy("c.created_at", "desc");

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    thumbnail_url: r.thumbnail_url,
    discount_price: Number(r.discount_price || 0),
    status: r.status,
    rating_avg: Number(r.rating_avg || 0),
    rating_count: Number(r.rating_count || 0),
    enrollment_count: Number(r.enrollment_count || 0),
    category: { name: r.category_name || "Chưa có" },
    teacher: { full_name: r.teacher_full_name || "Không rõ" },
  }));
};

//=================
// ADMIN - USERS MANAGEMENT
//=================

export const getAllAdminUsers = async () => {
  const rows = await database("users")
    .select(
      "id",
      "full_name",
      "email",
      "role",
      "status",
      "avatar_url",
      "created_at"
    )
    .orderBy("created_at", "desc");

  return rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    role: r.role,
    status: r.status || 'active',
    avatar_url: r.avatar_url || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
    created_at: r.created_at,
  }));
};

//=================
// ADMIN - DASHBOARD STATS
//=================

export const getAdminDashboardStats = async () => {
  // 🔹 Tổng số người dùng
  const [{ total_users }] = await database("users").count("* as total_users");

  // 🔹 Tổng số giảng viên và học viên
  const [{ total_teachers }] = await database("users")
    .where("role", "teacher")
    .count("* as total_teachers");

  const [{ total_students }] = await database("users")
    .where("role", "student")
    .count("* as total_students");

  // 🔹 Tổng số khóa học
  const [{ total_courses }] = await database("courses").count("* as total_courses");

  // 🔹 Số khóa học pending hoặc nháp
  const [{ pending_courses }] = await database("courses")
    .where("status", "draft")
    .count("* as pending_courses");

  // 🔹 Doanh thu tạm tính (giả định = enrollment_count * discount_price)
  const [{ total_revenue }] = await database("courses")
    .sum(database.raw("COALESCE(enrollment_count, 0) * COALESCE(discount_price, 0) as total_revenue"));

  // 🔹 5 hoạt động gần đây (giả lập dựa theo thời gian tạo user/course)
  const recentUsers = await database("users")
    .select("full_name", "created_at")
    .orderBy("created_at", "desc")
    .limit(3);

  const recentCourses = await database("courses")
    .select("title", "created_at")
    .orderBy("created_at", "desc")
    .limit(3);

  const recentActivities = [
    ...recentUsers.map((u) => ({
      type: "new_user",
      message: `${u.full_name} đã đăng ký tài khoản`,
      timestamp: u.created_at,
    })),
    ...recentCourses.map((c) => ({
      type: "new_course",
      message: `Khóa học "${c.title}" đã được tạo`,
      timestamp: c.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // 🔹 Các khóa học phổ biến (top 5 theo enrollment_count)
  const popularCourses = await database("courses")
    .select("id", "title", "enrollment_count", "rating_avg")
    .orderBy("enrollment_count", "desc")
    .limit(5);

  return {
    stats: {
      total_users: Number(total_users || 0),
      total_courses: Number(total_courses || 0),
      total_teachers: Number(total_teachers || 0),
      total_students: Number(total_students || 0),
      total_revenue: Number(total_revenue || 0),
      pending_courses: Number(pending_courses || 0),
    },
    recentActivities,
    popularCourses,
  };
};

