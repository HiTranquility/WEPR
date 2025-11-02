import database from "../utils/database.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const baseQuery = database("users");

//=================
// USERS - CRUD
//=================

export const createUser = async (user) => {
  return await database("users").insert(user).returning("*");
};

export const readUser = async (id) => {
  return await database("users").where("id", id).first();
};

export const updateUser = async (id, data) => {
  return await database("users").where("id", id).update(data).returning("*");
};

export const deleteUser = async (id) => {
  return await database("users").where("id", id).del();
};

export const getAllUsers = async () => {
  return await database("users").select("*").orderBy("id", "asc");
};

// =================
// AUTH HELPERS
// =================

// Minimal public profile for attaching to req.user after JWT verification
export const getUserPublicById = async (id) => {
  return await database("users")
    .where({ id })
    .first("id", "full_name", "email", "role", "avatar_url");
};

// =================
// AUTH / LOCAL SIGNUP
// =================

export const registerLocalUser = async ({ fullName, email, password, role = "student" }) => {
  if (!fullName || !email || !password) {
    const err = new Error("Missing required fields");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    const err = new Error("Email already exists");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const payload = {
    full_name: fullName,
    email,
    password_hash: hashed,
    role: role || "student",
  };

  const inserted = await createUser(payload);
  return inserted && inserted[0] ? inserted[0] : null;
};

// =================
// AUTH / GOOGLE HELPERS
// =================

export const buildAuthPayload = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    name: user.full_name,
    email: user.email,
  };
};

export const getDashboardRedirectByRole = (role) => {
  const map = { admin: "/admin/dashboard", teacher: "/teacher/dashboard", student: "/student/dashboard" };
  return map[role] || "/";
};

export const findOrCreateGoogleUser = async ({ email, fullName, googleId, defaultRole = "student" }) => {
  const existing = await getUserByEmail(email);
  if (existing) return existing;
  try {
    const randomPassword = crypto.randomUUID();
    const hashed = await bcrypt.hash(randomPassword, 10);
    const payload = {
      full_name: fullName || "",
      email,
      password_hash: hashed, // store random hash to satisfy NOT NULL; cannot be used to login
      role: defaultRole,
      // Note: do NOT insert google_id unless the column exists in schema
    };
    const inserted = await createUser(payload);
    return inserted && inserted[0] ? inserted[0] : null;
  } catch (err) {
    console.error('findOrCreateGoogleUser insert error:', err);
    throw err;
  }
};

// models/user.model.js
export const getUserByEmail = async (email) => {
  return await database("users").where('email', email).first();
};

//=================
// STUDENTS - CRUD
//=================

export const createStudent = async (student) => {
  student.role = "student";
  return await database("users").insert(student).returning("*");
};

export const readStudent = async (id) => {
  return await database("users").where({ id, role: "student" }).first();
};

export const updateStudent = async (id, data) => {
  return await database("users").where({ id, role: "student" }).update(data).returning("*");
};

export const deleteStudent = async (id) => {
  return await database("users").where({ id, role: "student" }).del();
};

export const getAllStudents = async () => {
  return await database("users")
    .where("role", "student")
    .select("id", "full_name", "email", "avatar_url", "created_at")
    .orderBy("id", "asc");
};

//=================
// TEACHERS - CRUD
//=================

export const createTeacher = async (teacher) => {
  teacher.role = "teacher";
  return await database("users").insert(teacher).returning("*");
};

export const readTeacher = async (id) => {
  return await database("users").where({ id, role: "teacher" }).first();
};

export const updateTeacher = async (id, data) => {
  return await database("users").where({ id, role: "teacher" }).update(data).returning("*");
};

export const deleteTeacher = async (id) => {
  return await database("users").where({ id, role: "teacher" }).del();
};

//=================
// TEACHER DASHBOARD SUMMARY
//=================

export const getTeacherDashboard = async (teacherId) => {
  // 🔹 Lấy thông tin giảng viên
  const teacher = await database("users")
    .where({ id: teacherId, role: "teacher" })
    .select("id", "full_name", "email", "avatar_url", "bio", "created_at")
    .first();

  if (!teacher) return null;

  const teacherUser = {
    id: teacher.id,
    full_name: teacher.full_name,
    email: teacher.email,
    avatar_url: teacher.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(teacher.full_name || "Teacher"),
    bio: teacher.bio || "",
    created_at: teacher.created_at,
    role: "teacher",
  };

  // 🔹 Lấy thống kê khóa học
  const [stats] = await database("courses")
    .where("teacher_id", teacherId)
    .select(
      database.raw("COUNT(*) AS total_courses"),
      database.raw("SUM(CASE WHEN status IN ('completed', 'published') THEN 1 ELSE 0 END) AS published_courses"),
      database.raw("SUM(CASE WHEN status IN ('draft', 'incomplete', 'pending') THEN 1 ELSE 0 END) AS draft_courses"),
      database.raw("SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_courses"),
      database.raw("COALESCE(SUM(enrollment_count), 0) AS total_students"),
      database.raw("COALESCE(SUM(enrollment_count * COALESCE(discount_price, price)), 0) AS total_revenue"),
      database.raw("COALESCE(AVG(rating_avg), 0) AS avg_rating")
    );

  // 🔹 Khóa học gần đây (theo created_at)
  const recentCourses = await database("courses")
    .where("teacher_id", teacherId)
    .orderBy("created_at", "desc")
    .limit(5)
    .select(
      "id",
      "title",
      "thumbnail_url",
      "status",
      "enrollment_count",
      "rating_avg",
      "view_count",
      "discount_price",
      "price",
      "last_updated",
      database.raw("COALESCE(enrollment_count * COALESCE(discount_price, price), 0) AS revenue")
    );

  const allCourses = await database("courses as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .where("c.teacher_id", teacherId)
    .select(
      "c.id",
      "c.title",
      "c.thumbnail_url",
      "c.status",
      "c.enrollment_count",
      "c.rating_avg",
      "c.discount_price",
      "c.price",
      database.ref("cat.name").as("category_name"),
      database.raw("COALESCE(c.enrollment_count * COALESCE(c.discount_price, c.price), 0) AS revenue")
    )
    .orderBy("c.last_updated", "desc");

  const normalizedStats = {
    total_courses: Number(stats.total_courses || 0),
    published_courses: Number(stats.published_courses || 0),
    draft_courses: Number(stats.draft_courses || 0),
    suspended_courses: Number(stats.suspended_courses || 0),
    total_students: Number(stats.total_students || 0),
    total_revenue: Number(stats.total_revenue || 0),
    avg_rating: Number(stats.avg_rating || 0),
  };

  const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  const statsList = [
    { label: "Tổng khóa học", value: normalizedStats.total_courses },
    { label: "Đã xuất bản", value: normalizedStats.published_courses },
    { label: "Bản nháp", value: normalizedStats.draft_courses },
    { label: "Đình chỉ", value: normalizedStats.suspended_courses },
    { label: "Học viên", value: normalizedStats.total_students },
    { label: "Doanh thu", value: currencyFormatter.format(normalizedStats.total_revenue) },
  ];

  // 🔹 Trả về object tổng hợp cho view
  const normalizeCourseStatus = (status) => {
    const value = (status || "").toLowerCase();
    if (["completed", "published"].includes(value)) return "published";
    if (["suspended"].includes(value)) return "suspended";
    if (["draft", "incomplete", "pending"].includes(value)) return "draft";
    return value || "draft";
  };

  return {
    user: teacherUser,
    teacher: teacherUser,
    stats: normalizedStats,
    statsList,
    recentCourses: recentCourses.map((c) => {
      const status = normalizeCourseStatus(c.status);
      const price = Number(c.price || 0);
      const discount = Number(c.discount_price || 0);
      const hasDiscount = discount > 0 && (price === 0 || discount < price);
      const finalPrice = hasDiscount ? discount : price;
      return {
        id: c.id,
        title: c.title,
        thumbnail_url: c.thumbnail_url,
        status,
        enrollment_count: Number(c.enrollment_count || 0),
        rating_avg: Number(c.rating_avg || 0),
        view_count: Number(c.view_count || 0),
        revenue: Number(c.revenue || 0),
        price,
        discount_price: hasDiscount ? discount : null,
        final_price: finalPrice,
        has_discount: hasDiscount,
        last_updated: c.last_updated,
      };
    }),
    allCourses: allCourses.map((c) => ({
      id: c.id,
      title: c.title,
      thumbnail_url: c.thumbnail_url || '',
      status: normalizeCourseStatus(c.status),
      enrollment_count: Number(c.enrollment_count || 0),
      rating_avg: Number(c.rating_avg || 0),
      revenue: Number(c.revenue || 0),
      price: Number(c.price || 0),
      discount_price: Number(c.discount_price || 0),
      category: { name: c.category_name || 'Chưa có' },
    })),
  };
};

//=================
// TEACHER - COURSE LIST
//=================

export const getTeacherCourses = async (teacherId) => {
  const rows = await database("courses as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .where("c.teacher_id", teacherId)
    .select(
      "c.id",
      "c.title",
      "c.thumbnail_url",
      "c.status",
      "c.enrollment_count",
      "c.rating_avg",
      "c.view_count",
      "c.discount_price",
      "c.last_updated", 
      database.ref("cat.name").as("category_name")
    )
    .orderBy("c.last_updated", "desc"); 

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    thumbnail_url: r.thumbnail_url,
    status: r.status === "completed" ? "published" : r.status,
    enrollment_count: r.enrollment_count,
    rating_avg: Number(r.rating_avg || 0),
    view_count: r.view_count,
    discount_price: Number(r.discount_price || 0),
    updated_at: r.last_updated, 
    category: { name: r.category_name },
  }));
};

//=================
// TEACHER - GET ALL CATEGORIES
//=================
export const getAllCategories = async () => {
  const rows = await database("categories")
    .select("id", "name")
    .orderBy("name", "asc");

  return rows;
};

//=================
// TEACHER - GET COURSE DETAIL
//=================
export const getTeacherCourseDetail = async (courseId) => {
  const course = await database("courses as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .leftJoin("users as t", "c.teacher_id", "t.id")
    .where("c.id", courseId)
    .first(
      "c.id",
      "c.title",
      "c.status",
      "c.price",
      "c.discount_price",
      "c.enrollment_count",
      "c.rating_avg",
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_name")
    );

  if (!course) return null;

  // 🔹 Tính doanh thu tạm thời (price hoặc discount_price * enrollment_count)
  const revenue =
    Number(course.enrollment_count || 0) *
    Number(course.discount_price || course.price || 0);

  return {
    id: course.id,
    title: course.title,
    status:
      course.status === "completed"
        ? "published"
        : course.status || "draft",
    category: { name: course.category_name },
    teacher_name: course.teacher_name,
    enrollment_count: Number(course.enrollment_count || 0),
    rating_avg: Number(course.rating_avg || 0),
    revenue,
  };
};

//=================
// TEACHER - MANAGE COURSE DETAIL
//=================
export const getTeacherManageCourse = async (courseId) => {
  const course = await database("courses as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .leftJoin("users as t", "c.teacher_id", "t.id")
    .where("c.id", courseId)
    .first(
      "c.id",
      "c.title",
      "c.short_description",
      "c.thumbnail_url",
      "c.price",
      "c.discount_price",
      "c.status",
      "c.enrollment_count",
      "c.rating_avg",
      "c.rating_count",
      "c.view_count",
      database.ref("cat.id").as("category_id"),
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_name")
    );

  if (!course) return null;

  // Lấy sections và lectures
  const sections = await database("sections")
    .where("course_id", courseId)
    .orderBy("order_index", "asc")
    .select("id", "title", "order_index");

  const lectures = sections.length > 0
    ? await database("lectures")
        .whereIn("section_id", sections.map(s => s.id))
        .orderBy("order_index", "asc")
        .select("id", "section_id", "title", "duration", "is_preview", "order_index")
    : [];

  // Tính tổng số bài giảng và thời lượng
  const totalLectures = lectures.length;
  const totalDurationSeconds = lectures.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours && minutes) return `${hours} giờ ${minutes} phút`;
    if (hours) return `${hours} giờ`;
    return `${minutes} phút`;
  };

  // Gắn lectures vào sections
  const structuredSections = sections.map(section => ({
    ...section,
    lectures: lectures.filter(lec => lec.section_id === section.id)
  }));

  return {
    id: course.id,
    title: course.title,
    short_description: course.short_description || '',
    thumbnail_url: course.thumbnail_url,
    price: Number(course.price || 0),
    discount_price: course.discount_price ? Number(course.discount_price) : null,
    status: course.status || "draft",
    enrollment_count: Number(course.enrollment_count || 0),
    rating_avg: Number(course.rating_avg || 0),
    rating_count: Number(course.rating_count || 0),
    view_count: Number(course.view_count || 0),
    category: { id: course.category_id, name: course.category_name || "Chưa có" },
    teacher_name: course.teacher_name,
    sections: structuredSections,
    total_lectures: totalLectures,
    total_duration: formatDuration(totalDurationSeconds)
  };
};

//=================
// TEACHER - GET COURSE CONTENT (sections + lectures)
//=================
export const getTeacherCourseContent = async (courseId) => {
  // 🔹 Lấy thông tin cơ bản khóa học
  const course = await database("courses")
    .where("id", courseId)
    .first("id", "title", "thumbnail_url");

  if (!course) return null;

  // 🔹 Lấy danh sách section
  const sections = await database("sections")
    .where("course_id", courseId)
    .orderBy("order_index", "asc")
    .select("id", "title", "order_index");

  // 🔹 Lấy danh sách lecture theo section
  const lectureSectionIds = sections.map((s) => s.id);

  const lectures = lectureSectionIds.length
    ? await database("lectures")
        .whereIn("section_id", lectureSectionIds)
        .orderBy("order_index", "asc")
        .select("id", "section_id", "title", "duration", "video_url", "is_preview", "order_index")
    : [];

  // 🔹 Gắn lectures vào từng section
  const structuredSections = sections.map((section) => ({
    ...section,
    lectures: lectures.filter((lec) => lec.section_id === section.id),
  }));

  return {
    ...course,
    sections: structuredSections,
  };
};

//=================
// TEACHER - GET COURSE + SECTION INFO (for create lecture)
//=================
export const getCourseSectionInfo = async (courseId, sectionId) => {
  const result = await database("sections as s")
    .leftJoin("courses as c", "s.course_id", "c.id")
    .where("s.id", sectionId)
    .andWhere("s.course_id", courseId)
    .first(
      "c.id as course_id",
      "c.title as course_title",
      "s.id as section_id",
      "s.title as section_title"
    );
  console.log("getCourseSectionInfo:", result);
  return result || null;
};

//=================
// TEACHER - GET COURSE INFO (for creating new section)
//=================
export const getCourseInfoForSection = async (courseId) => {
  const result = await database("courses as c")
    .leftJoin("users as t", "c.teacher_id", "t.id")
    .where("c.id", courseId)
    .first(
      "c.id as course_id",
      "c.title as course_title",
      "t.full_name as teacher_name"
    );

  // Nếu không có khóa học thì trả về null
  return result || null;
};

//=================
// TEACHER - GET COURSE DETAIL FOR EDIT
//=================
export const getCourseDetailForEdit = async (courseId) => {
  const result = await database("courses as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .leftJoin("users as t", "c.teacher_id", "t.id")
    .where("c.id", courseId)
    .first(
      "c.id as course_id",
      "c.title",
      "c.short_description",
      "c.detailed_description",
      "c.thumbnail_url",
      "c.price",
      "c.discount_price",
      "c.category_id",
      "cat.name as category_name",
      "c.status",
      "t.full_name as teacher_name"
    );

  return result || null;
};


//=================
// LANDING PAGE SCHEMA
//=================

const TEACHER_WITH_STATS = [
  "users.id",
  "users.full_name",
  "users.email",
  "users.avatar_url",
  "users.bio",
  "users.status",
  "users.created_at",
];

export const getAllTeachersWithStats = async () => {
  const rows = await baseQuery
    .clone()
    .leftJoin("courses", "users.id", "courses.teacher_id")
    .where("users.role", "teacher")
    .groupBy("users.id")
    .select(
      ...TEACHER_WITH_STATS,
      database.raw("COUNT(courses.id) AS total_courses"),
      database.raw("COALESCE(AVG(courses.rating_avg), 0) AS avg_rating")
    );

  console.log("getAllTeachersWithStats:", rows);
  return rows;
};

//=================
// EXTRA: STUDENT ENROLLMENT SUMMARY (OPTIONAL)
//=================

const STUDENT_WITH_ENROLLMENTS = [
  "users.id",
  "users.full_name",
  "users.email",
  "users.avatar_url",
  "users.created_at",
  "users.status",
];

export const getStudentsWithEnrollments = async () => {
  const rows = await baseQuery
    .clone()
    .leftJoin("enrollments", "users.id", "enrollments.student_id")
    .where("users.role", "student")
    .groupBy("users.id")
    .select(
      ...STUDENT_WITH_ENROLLMENTS,
      database.raw("COUNT(enrollments.id) AS total_enrolled_courses")
    );

  console.log("getStudentsWithEnrollments:", rows);
  return rows;
};

//=================
// STUDENT DASHBOARD SUMMARY
//=================

export const getStudentDashboard = async (studentId) => {
  // 🔹 Lấy thông tin học viên
  const user = await baseQuery
    .clone()
    .where({ id: studentId, role: "student" })
    .select("id", "full_name", "email", "avatar_url", "created_at")
    .first();

  if (!user) return null;

  // 🔹 Thống kê học tập (dựa vào enrollments)
  const [stats] = await database("enrollments")
    .where("student_id", studentId)
    .select(
      database.raw("COUNT(*) AS enrolled_courses"),
      database.raw("SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed_courses"),
      database.raw("SUM(CASE WHEN completed_at IS NULL THEN 1 ELSE 0 END) AS in_progress_courses")
    );

  // 🔹 Các khóa học gần đây (theo thời điểm ghi danh)
  const recentCourses = await database("enrollments AS e")
    .leftJoin("courses AS c", "e.course_id", "c.id")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .where("e.student_id", studentId)
    .orderBy("e.enrolled_at", "desc")
    .limit(5)
    .select(
      "c.id",
      "c.title",
      "c.thumbnail_url",
      "c.created_at",
      "c.discount_price",
      "c.price",
      "c.view_count",
      "e.enrolled_at",
      "e.completed_at",
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("t.avatar_url").as("teacher_avatar"),
      database.raw(`(
        SELECT COUNT(l2.id)
        FROM sections s2
        LEFT JOIN lectures l2 ON l2.section_id = s2.id
        WHERE s2.course_id = c.id
      ) AS total_lectures`)
    );

  // 🔹 Khóa học gợi ý (featured)
  const recommendedCourses = await database("courses AS c")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .where("c.is_featured", true)
    .orderBy("c.rating_avg", "desc")
    .limit(3)
    .select(
      "c.id",
      "c.title",
      "c.thumbnail_url",
      "c.discount_price",
      "c.price",
      "c.rating_avg",
      "c.rating_count",
      "c.view_count",
      "c.created_at",
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("t.avatar_url").as("teacher_avatar"),
      database.ref("cat.name").as("category_name")
    );
  // 🔹 Trả dữ liệu về đúng shape cho view dashboard
  const normalizedStats = {
    enrolled_courses: Number(stats.enrolled_courses || 0),
    completed_courses: Number(stats.completed_courses || 0),
    in_progress_courses: Number(stats.in_progress_courses || 0),
    certificates: 0,
  };

  const [{ total: watchlistTotal = 0 }] = await database("watchlist AS w")
    .where("w.student_id", studentId)
    .count({ total: "w.id" });

  const watchlistRows = await database("watchlist AS w")
    .leftJoin("courses AS c", "w.course_id", "c.id")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .where("w.student_id", studentId)
    .orderBy("w.added_at", "desc")
    .limit(6)
    .select(
      "w.id AS watch_id",
      "w.added_at",
      "c.id AS course_id",
      "c.title",
      "c.thumbnail_url",
      "c.rating_avg",
      "c.rating_count",
      "c.price",
      "c.discount_price",
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("cat.name").as("category_name")
    );

  return {
    user: {
      ...user,
      role: "student",
    },
    stats: normalizedStats,
    statsList: [
      { label: "Khóa học đã đăng ký", value: normalizedStats.enrolled_courses },
      { label: "Đang học", value: normalizedStats.in_progress_courses },
      { label: "Đã hoàn thành", value: normalizedStats.completed_courses },
      { label: "Yêu thích", value: Number(watchlistTotal || 0) },
    ],
    recentCourses: recentCourses.map((r) => {
      const totalLectures = Number(r.total_lectures || 0);
      const isCompleted = !!r.completed_at;
      const progress = isCompleted ? 100 : 0;
      return {
        id: r.id,
        title: r.title,
        thumbnail_url: r.thumbnail_url,
        enrolled_at: r.enrolled_at,
        discount_price: r.discount_price,
        price: r.price,
        view_count: r.view_count,
        created_at: r.created_at,
        progress,
        total_lectures: totalLectures,
        completed_lectures: isCompleted ? totalLectures : 0,
        teacher: {
          full_name: r.teacher_full_name,
          avatar_url: r.teacher_avatar,
        },
      };
    }),
    recommendedCourses: recommendedCourses.map((r) => ({
      id: r.id,
      title: r.title,
      thumbnail_url: r.thumbnail_url,
      rating_avg: r.rating_avg,
      rating_count: r.rating_count,
      discount_price: r.discount_price,
      price: r.price,
      view_count: r.view_count,
      created_at: r.created_at,
      category: { name: r.category_name },
      teacher: {
        full_name: r.teacher_full_name,
        avatar_url: r.teacher_avatar,
      },
    })),
    watchlist: watchlistRows.map((r) => {
      const price = Number(r.price || 0);
      const discount = Number(r.discount_price || 0);
      const hasDiscount = discount > 0 && (price === 0 || discount < price);
      const finalPrice = hasDiscount ? discount : price;
      return {
        id: r.watch_id,
        added_at: r.added_at,
        course: {
          id: r.course_id,
          title: r.title,
          thumbnail_url: r.thumbnail_url,
          rating_avg: Number(r.rating_avg || 0),
          rating_count: Number(r.rating_count || 0),
          price,
          discount_price: hasDiscount ? discount : null,
          final_price: finalPrice,
          has_discount: hasDiscount,
          teacher: { full_name: r.teacher_full_name },
          category: { name: r.category_name },
        },
      };
    }),
  };
};

//=================
// STUDENT ENROLLED COURSES
//=================

export const getStudentCourses = async (studentId) => {
  // 🔹 Kiểm tra học viên có tồn tại không
  const student = await baseQuery
    .clone()
    .where({ id: studentId, role: "student" })
    .select("id", "full_name", "email", "avatar_url")
    .first();

  if (!student) return null;

  // 🔹 Lấy danh sách khóa học đã ghi danh
  const rows = await database("enrollments AS e")
    .leftJoin("courses AS c", "e.course_id", "c.id")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .where("e.student_id", studentId)
    .orderBy("e.enrolled_at", "desc")
    .select(
      "e.id AS enrollment_id",
      "e.enrolled_at",
      "e.completed_at",
      "c.id AS course_id",
      "c.title",
      "c.thumbnail_url",
      "c.status",
      "c.discount_price",
      "c.price",
      "c.rating_avg",
      "c.rating_count",
      "c.view_count",
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("t.avatar_url").as("teacher_avatar"),
      database.ref("cat.name").as("category_name"),
      database.raw(`(
        SELECT COUNT(l2.id)
        FROM sections s2
        LEFT JOIN lectures l2 ON l2.section_id = s2.id
        WHERE s2.course_id = c.id
      ) AS total_lectures`)
    );  

  const enrolledCourses = rows.map(r => {
    const totalLectures = Number(r.total_lectures || 0);
    const isCompleted = !!r.completed_at;
    const completedLectures = isCompleted ? totalLectures : 0;
    const progress = isCompleted ? 100 : (totalLectures > 0 ? Math.min(99, Math.round((completedLectures / totalLectures) * 100)) : 0);

    return {
      enrollment_id: r.enrollment_id,
      enrolled_at: r.enrolled_at,
      completed_at: r.completed_at,
      progress,
      completed_lectures: completedLectures,
      total_lectures: totalLectures,
      course: {
        id: r.course_id,
        title: r.title,
        thumbnail_url: r.thumbnail_url,
        status: r.status,
        discount_price: r.discount_price,
        price: r.price,
        rating_avg: r.rating_avg,
        rating_count: r.rating_count,
        view_count: r.view_count,
        category: { name: r.category_name },
        teacher: {
          full_name: r.teacher_full_name,
          avatar_url: r.teacher_avatar,
        },
      },
    };
  });

  return { user: { ...student, role: "student" }, enrolledCourses };
};

//=================
// STUDENT WATCHLIST
//=================

export const getStudentWatchlist = async (studentId) => {
  // 🔹 Lấy thông tin học viên
  const student = await baseQuery
    .clone()
    .where({ id: studentId, role: "student" })
    .select("id", "full_name", "email", "avatar_url")
    .first();

  if (!student) return null;

  // 🔹 Lấy danh sách yêu thích
  const rows = await database("watchlist AS w")
    .leftJoin("courses AS c", "w.course_id", "c.id")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .where("w.student_id", studentId)
    .orderBy("w.added_at", "desc")
    .select(
      "w.id AS watch_id",
      "w.added_at",
      "c.id AS course_id",
      "c.title",
      "c.thumbnail_url",
      "c.rating_avg",
      "c.rating_count",
      "c.enrollment_count",
      "c.discount_price",
      "c.price",
      "c.view_count",
      "c.created_at",
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("t.avatar_url").as("teacher_avatar_url")
    );

  // 🔹 Chuẩn hóa dữ liệu cho view
  const watchlist = rows.map((r) => {
    const price = Number(r.price || 0);
    const discount = Number(r.discount_price || 0);
    const hasDiscount = discount > 0 && (price === 0 || discount < price);
    const finalPrice = hasDiscount ? discount : price;

    return {
      id: r.watch_id,
      added_at: r.added_at,
      course: {
        id: r.course_id,
        title: r.title,
        thumbnail_url: r.thumbnail_url,
        rating_avg: Number(r.rating_avg || 0),
        rating_count: Number(r.rating_count || 0),
        enrollment_count: Number(r.enrollment_count || 0),
        price,
        discount_price: hasDiscount ? discount : null,
        final_price: finalPrice,
        has_discount: hasDiscount,
        view_count: r.view_count,
        created_at: r.created_at,
        category: { name: r.category_name },
        teacher: {
          full_name: r.teacher_full_name,
          avatar_url: r.teacher_avatar_url,
        },
      },
    };
  });

  return { user: { ...student, role: "student" }, watchlist };
};

//=================
// STUDENT LEARN PAGE (REAL DATA ONLY)
//=================

export const getCourseLearningData = async (studentId, courseId) => {
  // 🔹 Lấy thông tin khóa học
  const course = await database("courses AS c")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .select(
      "c.id",
      "c.title",
      database.ref("cat.name").as("category_name")
    )
    .where("c.id", courseId)
    .first();

  if (!course) return null;

  // 🔹 Lấy danh sách sections và lectures thật
  const rows = await database("sections AS s")
    .leftJoin("lectures AS l", "s.id", "l.section_id")
    .where("s.course_id", courseId)
    .orderBy([
      { column: "s.order_index", order: "asc" },
      { column: "l.order_index", order: "asc" }
    ])
    .select(
      "s.id AS section_id",
      "s.title AS section_title",
      "l.id AS lecture_id",
      "l.title AS lecture_title",
      "l.video_url",
      "l.duration",
      "l.is_preview"
    );

  // 🔹 Gom bài giảng theo từng section
  const sectionMap = new Map();
  rows.forEach((r) => {
    if (!sectionMap.has(r.section_id)) {
      sectionMap.set(r.section_id, {
        title: r.section_title,
        lectures: [],
      });
    }
    if (r.lecture_id) {
      sectionMap.get(r.section_id).lectures.push({
        id: r.lecture_id,
        title: r.lecture_title,
        duration: r.duration ? `${r.duration} phút` : null,
        video_url: r.video_url,
        is_preview: r.is_preview,
      });
    }
  });

  const sections = Array.from(sectionMap.values());

  // 🔹 Lấy bài giảng đầu tiên làm mặc định (nếu có)
  const firstLecture = rows.length > 0 && rows[0].lecture_id
    ? {
        id: rows[0].lecture_id,
        title: rows[0].lecture_title,
        video_url: rows[0].video_url,
        description: null,
        resources: [],
      }
    : null;

  return {
    course: {
      id: course.id,
      title: course.title,
      category: { name: course.category_name },
      sections,
    },
    currentLecture: firstLecture,
    currentLectureIndex: firstLecture ? 1 : 0,
    notes: [],
  };
};

//=================
// TEACHER SETTINGS & PROFILE
//=================

async function ensureTeacherProfileRow(teacherId) {
  const existing = await database("teacher_profiles")
    .where({ teacher_id: teacherId })
    .first();

  if (existing) return existing;

  const [created] = await database("teacher_profiles")
    .insert({ teacher_id: teacherId })
    .onConflict("teacher_id")
    .ignore()
    .returning("*");

  if (created) return created;

  return await database("teacher_profiles")
    .where({ teacher_id: teacherId })
    .first();
}

export const getTeacherSettings = async (teacherId) => {
  const user = await database("users")
    .where({ id: teacherId, role: "teacher" })
    .first("id", "full_name", "email", "avatar_url", "bio");

  if (!user) return null;

  const profile = await ensureTeacherProfileRow(teacherId);

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url || "",
      bio: user.bio || "",
      role: "teacher",
    },
    preferences: {
      email_notifications: profile?.email_notifications ?? true,
      course_reviews: profile?.course_reviews ?? true,
    },
    payment: {
      bank_name: profile?.bank_name || "",
      account_number: profile?.account_number || "",
      account_name: profile?.account_name || "",
    },
  };
};

export const updateTeacherProfileInfo = async (teacherId, { full_name, avatar_url, bio }) => {
  const now = new Date();
  const [updated] = await database("users")
    .where({ id: teacherId, role: "teacher" })
    .update(
      {
        ...(full_name !== undefined ? { full_name } : {}),
        ...(avatar_url !== undefined ? { avatar_url } : {}),
        ...(bio !== undefined ? { bio } : {}),
        updated_at: now,
      },
      "*"
    );

  return updated
    ? {
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        avatar_url: updated.avatar_url,
        bio: updated.bio,
        role: "teacher",
      }
    : null;
};

export const updateTeacherPassword = async (teacherId, currentPassword, newPassword) => {
  const teacher = await database("users")
    .where({ id: teacherId, role: "teacher" })
    .first("password_hash");

  if (!teacher) {
    return { ok: false, code: "NOT_FOUND" };
  }

  if (!teacher.password_hash) {
    return { ok: false, code: "NO_PASSWORD_SET" };
  }

  const bcrypt = (await import("bcrypt")).default;

  const isValid = await bcrypt.compare(currentPassword, teacher.password_hash);
  if (!isValid) {
    return { ok: false, code: "INVALID_PASSWORD" };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await database("users")
    .where({ id: teacherId, role: "teacher" })
    .update({ password_hash: newHash, updated_at: new Date() });

  return { ok: true };
};

export const upsertTeacherPaymentInfo = async (teacherId, { bank_name, account_number, account_name }) => {
  const now = new Date();
  await database("teacher_profiles")
    .insert({
      teacher_id: teacherId,
      bank_name: bank_name || null,
      account_number: account_number || null,
      account_name: account_name || null,
      updated_at: now,
    })
    .onConflict("teacher_id")
    .merge({
      bank_name: bank_name || null,
      account_number: account_number || null,
      account_name: account_name || null,
      updated_at: now,
    });
};

export const updateTeacherPreferences = async (teacherId, { email_notifications, course_reviews }) => {
  const now = new Date();
  await database("teacher_profiles")
    .insert({
      teacher_id: teacherId,
      email_notifications: email_notifications ?? true,
      course_reviews: course_reviews ?? true,
      updated_at: now,
    })
    .onConflict("teacher_id")
    .merge({
      email_notifications: email_notifications ?? true,
      course_reviews: course_reviews ?? true,
      updated_at: now,
    });
};

export const getStudentProfileInfo = async (studentId) => {
  const dashboard = await getStudentDashboard(studentId);
  if (!dashboard) return null;

  const enrolledCount = dashboard.stats?.enrolled_courses || 0;
  const wishlistCount = await database("watchlist")
    .where({ student_id: studentId })
    .count("* as count")
    .first();

  return {
    user: dashboard.user,
    stats: dashboard.stats,
    statsList: dashboard.statsList,
    enrolledCourses: dashboard.recentCourses,
    wishlist_count: Number(wishlistCount?.count || 0),
  };
};

export const getTeacherProfileInfo = async (teacherId) => {
  const dashboard = await getTeacherDashboard(teacherId);
  if (!dashboard) return null;

  const payout = await database("teacher_profiles")
    .where({ teacher_id: teacherId })
    .first("bank_name", "account_number", "account_name");

  return {
    user: dashboard.user,
    stats: dashboard.stats,
    statsList: dashboard.statsList,
    recentCourses: dashboard.recentCourses,
    payment: payout || {},
  };
};









