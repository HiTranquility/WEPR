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

export const getAllTeachers = async () => {
  return await baseQuery
    .clone()
    .where("role", "teacher")
    .select("id", "full_name", "email", "avatar_url", "bio", "status")
    .orderBy("id", "asc");
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