import database from "../utils/database.js";

export async function addToWatchlist(studentId, courseId) {
  const existing = await database("watchlist")
    .where({ student_id: studentId, course_id: courseId })
    .first();

  if (existing) {
    throw new Error("Course already in watchlist");
  }

  const [item] = await database("watchlist")
    .insert({
      student_id: studentId,
      course_id: courseId,
      added_at: new Date()
    })
    .returning("*");

  return item;
}

export async function removeFromWatchlist(studentId, courseId) {
  const deleted = await database("watchlist")
    .where({ student_id: studentId, course_id: courseId })
    .del();

  return deleted > 0;
}

export async function checkInWatchlist(studentId, courseId) {
  const item = await database("watchlist")
    .where({ student_id: studentId, course_id: courseId })
    .first();
  return !!item;
}

export async function getStudentWatchlist(studentId) {
  return await database("watchlist")
    .where("student_id", studentId)
    .select("*");
}
