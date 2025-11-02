import database from "../utils/database.js";

export async function createEnrollment(studentId, courseId) {
  const existing = await database("enrollments")
    .where({ student_id: studentId, course_id: courseId })
    .first();

  if (existing) {
    throw new Error("Already enrolled in this course");
  }

  const [enrollment] = await database("enrollments")
    .insert({
      student_id: studentId,
      course_id: courseId,
      enrolled_at: new Date()
    })
    .returning("*");

  await database("courses")
    .where("id", courseId)
    .increment("enrollment_count", 1);

  return enrollment;
}

export async function checkEnrollment(studentId, courseId) {
  const enrollment = await database("enrollments")
    .where({ student_id: studentId, course_id: courseId })
    .first();
  return !!enrollment;
}

export async function getStudentEnrollments(studentId) {
  return await database("enrollments")
    .where("student_id", studentId)
    .select("*");
}
