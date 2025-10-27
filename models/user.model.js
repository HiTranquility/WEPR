import database from "../utils/database.js";

export const baseQuery = database("users");

//=================
// USERS - CRUD
//=================

export const createUser = async (user) => {
  return await baseQuery.insert(user).returning("*");
};

export const readUser = async (id) => {
  return await baseQuery.where("id", id).first();
};

export const updateUser = async (id, data) => {
  return await baseQuery.where("id", id).update(data).returning("*");
};

export const deleteUser = async (id) => {
  return await baseQuery.where("id", id).del();
};

export const getAllUsers = async () => {
  return await baseQuery.select("*").orderBy("id", "asc");
};

// models/user.model.js
export const getUserByEmail = async (email) => {
  return await baseQuery.clone().where('email', email).first();
};

//=================
// STUDENTS - CRUD
//=================

export const createStudent = async (student) => {
  student.role = "student";
  return await baseQuery.insert(student).returning("*");
};

export const readStudent = async (id) => {
  return await baseQuery.where({ id, role: "student" }).first();
};

export const updateStudent = async (id, data) => {
  return await baseQuery.where({ id, role: "student" }).update(data).returning("*");
};

export const deleteStudent = async (id) => {
  return await baseQuery.where({ id, role: "student" }).del();
};

export const getAllStudents = async () => {
  return await baseQuery
    .clone()
    .where("role", "student")
    .select("id", "full_name", "email", "avatar_url", "created_at", "status")
    .orderBy("id", "asc");
};

//=================
// TEACHERS - CRUD
//=================

export const createTeacher = async (teacher) => {
  teacher.role = "teacher";
  return await baseQuery.insert(teacher).returning("*");
};

export const readTeacher = async (id) => {
  return await baseQuery.where({ id, role: "teacher" }).first();
};

export const updateTeacher = async (id, data) => {
  return await baseQuery.where({ id, role: "teacher" }).update(data).returning("*");
};

export const deleteTeacher = async (id) => {
  return await baseQuery.where({ id, role: "teacher" }).del();
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

  // 🔹 Lấy thống kê khóa học
  const [stats] = await database("courses")
    .where("teacher_id", teacherId)
    .select(
      database.raw("COUNT(*) AS total_courses"),
      database.raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS published_courses"),
      database.raw("SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_courses"),
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
      database.raw("COALESCE(enrollment_count * COALESCE(discount_price, price), 0) AS revenue")
    );

  // 🔹 Trả về object tổng hợp cho view
  return {
    teacher,
    stats: {
      total_courses: Number(stats.total_courses || 0),
      published_courses: Number(stats.published_courses || 0),
      draft_courses: Number(stats.draft_courses || 0),
      total_students: Number(stats.total_students || 0),
      total_revenue: Number(stats.total_revenue || 0),
      avg_rating: Number(stats.avg_rating || 0),
    },
    recentCourses: recentCourses.map((c) => ({
      id: c.id,
      title: c.title,
      thumbnail_url: c.thumbnail_url,
      status: c.status === "completed" ? "published" : c.status,
      enrollment_count: c.enrollment_count,
      rating_avg: c.rating_avg,
      revenue: Number(c.revenue || 0),
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
// TEACHER - GET COURSE BY ID
//=================
export const getCourseById = async (courseId) => {
  const course = await database("courses as c")
    .leftJoin("categories as cat", "c.category_id", "cat.id")
    .where("c.id", courseId)
    .first(
      "c.id",
      "c.title",
      "c.short_description",
      "c.detailed_description",
      "c.thumbnail_url",
      "c.price",
      "c.discount_price",
      "c.status",
      "c.category_id",
      database.ref("cat.name").as("category_name")
    );

  return course;
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
      "c.thumbnail_url",
      "c.status",
      "c.enrollment_count",
      "c.rating_avg",
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_name")
    );

  if (!course) return null;

  return {
    id: course.id,
    title: course.title,
    thumbnail_url: course.thumbnail_url,
    status: course.status || "draft",
    enrollment_count: Number(course.enrollment_count || 0),
    rating_avg: Number(course.rating_avg || 0),
    category: { name: course.category_name },
    teacher_name: course.teacher_name,
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
  const lectures = await database("lectures")
    .whereIn(
      "section_id",
      sections.map((s) => s.id)
    )
    .orderBy("order_index", "asc")
    .select("id", "section_id", "title", "duration");

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
      "e.enrolled_at",
      database.ref("t.full_name").as("teacher_full_name")
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
      "c.rating_avg",
      "c.rating_count",
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("cat.name").as("category_name")
    );
    console.log("recommendedCourses:", recommendedCourses);
  // 🔹 Trả dữ liệu về đúng shape cho view dashboard
  return {
    user,
    stats: {
      enrolled_courses: Number(stats.enrolled_courses || 0),
      completed_courses: Number(stats.completed_courses || 0),
      in_progress_courses: Number(stats.in_progress_courses || 0),
      certificates: 0, // ⚠️ Chưa có bảng certificates trong schema thật
    },
    recentCourses: recentCourses.map((r) => ({
      id: r.id,
      title: r.title,
      thumbnail_url: r.thumbnail_url,
      enrolled_at: r.enrolled_at,
      teacher: { full_name: r.teacher_full_name },
    })),
    recommendedCourses: recommendedCourses.map((r) => ({
      id: r.id,
      title: r.title,
      thumbnail_url: r.thumbnail_url,
      rating_avg: r.rating_avg,
      rating_count: r.rating_count,
      discount_price: r.discount_price,
      category: { name: r.category_name },
      teacher: { full_name: r.teacher_full_name },
    })),
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
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("cat.name").as("category_name")
    );

  // 🔹 Tính progress giả định (vì DB chưa có lectures/progress)
  const enrolledCourses = rows.map((r, i) => ({
    id: r.enrollment_id,
    progress: r.completed_at ? 100 : 50, // ⚙️ demo: 100% nếu completed, 50% nếu đang học
    completed_lectures: r.completed_at ? 10 : 5,
    total_lectures: 10,
    course: {
      id: r.course_id,
      title: r.title,
      thumbnail_url: r.thumbnail_url,
      category: { name: r.category_name },
      teacher: { full_name: r.teacher_full_name },
    },
  }));

  return { user: student, enrolledCourses };
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
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("t.avatar_url").as("teacher_avatar_url")
    );

  // 🔹 Chuẩn hóa dữ liệu cho view
  const watchlist = rows.map((r) => ({
    id: r.watch_id,
    added_at: r.added_at,
    course: {
      id: r.course_id,
      title: r.title,
      thumbnail_url: r.thumbnail_url,
      rating_avg: r.rating_avg,
      rating_count: r.rating_count,
      enrollment_count: r.enrollment_count,
      discount_price: r.discount_price,
      category: { name: r.category_name },
      teacher: {
        full_name: r.teacher_full_name,
        avatar_url: r.teacher_avatar_url,
      },
    },
  }));

  return { user: student, watchlist };
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
      "avatar_url",
      "created_at"
    )
    .orderBy("created_at", "desc");

  return rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    role: r.role,
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

