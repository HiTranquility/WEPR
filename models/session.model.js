// models/session.model.js
import database from "../utils/database.js";

export const baseQuery = database("sessions");
const lecturesQuery = database("lectures");

//=================
// Sessions - CRUD
//=================

export const createSession = async (session) => {
  return await baseQuery.insert(session);
};

export const readSession = async (id) => {
  return await baseQuery.where("id", id).first();
};

export const updateSession = async (id, data) => {
  return await baseQuery.where("id", id).update(data);
};

export const deleteSession = async (id) => {
  return await baseQuery.where("id", id).del();
};

export const getAllSessions = async () => {
  return await baseQuery.select("*");
};

//=================
// Lectures - CRUD
//=================

export const createLecture = async (lecture) => {
  return await lecturesQuery.insert(lecture);
};

export const readLecture = async (id) => {
  return await lecturesQuery.where("id", id).first();
};

export const updateLecture = async (id, data) => {
  return await lecturesQuery.where("id", id).update(data);
};

export const deleteLecture = async (id) => {
  return await lecturesQuery.where("id", id).del();
};

export const getAllLectures = async () => {
  return await lecturesQuery.select("*");
};

//=================
// Sessions with Relations
//=================

const SESSION_WITH_DETAILS = [
  "sessions.id",
  "sessions.title",
  "sessions.course_id",
  "sessions.start_time",
  "sessions.end_time",
  "sessions.status",
  { course_title: "courses.title" },
  { instructor_id: "users.id" },
  { instructor_name: "users.full_name" },
  { instructor_avatar_url: "users.avatar_url" },
];

export const getAllSessionsWithDetails = async () => {
  const rows = await baseQuery
    .clone()
    .leftJoin("courses", "sessions.course_id", "courses.id")
    .leftJoin("users", "courses.teacher_id", "users.id")
    .select(...SESSION_WITH_DETAILS);

  const mapped = rows.map((r) => ({
    id: r.id,
    title: r.title,
    start_time: r.start_time,
    end_time: r.end_time,
    status: r.status,
    course: { id: r.course_id, title: r.course_title },
    instructor: {
      id: r.instructor_id,
      full_name: r.instructor_name,
      avatar_url: r.instructor_avatar_url,
    },
  }));

  console.log("getAllSessionsWithDetails:", mapped);
  return mapped;
};