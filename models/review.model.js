import database from "../utils/database.js";

export async function createReview(studentId, courseId, rating, comment) {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const existing = await database("reviews")
    .where({ student_id: studentId, course_id: courseId })
    .first();

  if (existing) {
    throw new Error("You have already reviewed this course");
  }

  const [review] = await database("reviews")
    .insert({
      student_id: studentId,
      course_id: courseId,
      rating,
      comment: comment || "",
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning("*");

  await updateCourseRating(courseId);

  return review;
}

export async function updateReview(reviewId, studentId, rating, comment) {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const review = await database("reviews")
    .where({ id: reviewId, student_id: studentId })
    .first();

  if (!review) {
    throw new Error("Review not found or unauthorized");
  }

  const [updated] = await database("reviews")
    .where("id", reviewId)
    .update({
      rating,
      comment: comment || "",
      updated_at: new Date()
    })
    .returning("*");

  await updateCourseRating(review.course_id);

  return updated;
}

export async function deleteReview(reviewId, studentId) {
  const review = await database("reviews")
    .where({ id: reviewId, student_id: studentId })
    .first();

  if (!review) {
    throw new Error("Review not found or unauthorized");
  }

  await database("reviews").where("id", reviewId).del();
  await updateCourseRating(review.course_id);

  return true;
}

export async function getCourseReviews(courseId, limit = 10, offset = 0) {
  const reviews = await database("reviews as r")
    .leftJoin("users as u", "r.student_id", "u.id")
    .where("r.course_id", courseId)
    .orderBy("r.created_at", "desc")
    .limit(limit)
    .offset(offset)
    .select(
      "r.id",
      "r.rating",
      "r.comment",
      "r.created_at",
      "r.updated_at",
      database.ref("u.full_name").as("student_name"),
      database.ref("u.avatar_url").as("student_avatar")
    );

  return reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    updated_at: r.updated_at,
    student: {
      name: r.student_name,
      avatar: r.student_avatar
    }
  }));
}

async function updateCourseRating(courseId) {
  const [stats] = await database("reviews")
    .where("course_id", courseId)
    .select(
      database.raw("AVG(rating) as avg_rating"),
      database.raw("COUNT(*) as count")
    );

  await database("courses")
    .where("id", courseId)
    .update({
      rating_avg: stats.avg_rating || 0,
      rating_count: stats.count || 0
    });
}
