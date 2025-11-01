import database from "../utils/database.js";

export const addToWatchlist = async (studentId, courseId) => {
  return await database('watchlist')
    .insert({
      student_id: studentId,
      course_id: courseId,
      added_at: new Date()
    })
    .onConflict(['student_id', 'course_id'])
    .ignore()
    .returning('*');
};

export const removeFromWatchlist = async (studentId, courseId) => {
  return await database('watchlist')
    .where({ student_id: studentId, course_id: courseId })
    .del();
};

export const getWatchlist = async (studentId) => {
  return await database('watchlist')
    .join('courses', 'watchlist.course_id', 'courses.id')
    .join('users', 'courses.teacher_id', 'users.id')
    .where({ 'watchlist.student_id': studentId })
    .select(
      'courses.*',
      'users.fullname as teacher_name',
      'watchlist.added_at'
    )
    .orderBy('watchlist.added_at', 'desc');
};

export const enrollCourse = async (studentId, courseId) => {
  const trx = await database.transaction();
  try {
    const existing = await trx('enrollments')
      .where({ student_id: studentId, course_id: courseId })
      .first();
    
    if (existing) {
      await trx.rollback();
      return { success: false, message: 'Đã đăng ký khóa học này rồi!' };
    }
    
    await trx('enrollments').insert({
      student_id: studentId,
      course_id: courseId,
      enrolled_at: new Date()
    });
    
    await trx('courses')
      .where({ id: courseId })
      .increment('enrollment_count', 1);
    
    await trx.commit();
    return { success: true, message: 'Đăng ký thành công!' };
  } catch (err) {
    await trx.rollback();
    throw err;
  }
};

export const getEnrolledCourses = async (studentId) => {
  return await database('enrollments')
    .join('courses', 'enrollments.course_id', 'courses.id')
    .join('users', 'courses.teacher_id', 'users.id')
    .where({ 'enrollments.student_id': studentId })
    .select(
      'courses.*',
      'users.fullname as teacher_name',
      'enrollments.enrolled_at',
      'enrollments.progress',
      'enrollments.completed_at'
    )
    .orderBy('enrollments.enrolled_at', 'desc');
};

export const addReview = async (studentId, courseId, rating, comment) => {
  const trx = await database.transaction();
  try {
    const enrolled = await trx('enrollments')
      .where({ student_id: studentId, course_id: courseId })
      .first();
    
    if (!enrolled) {
      await trx.rollback();
      return { success: false, message: 'Phải đăng ký khóa học trước!' };
    }
    
    await trx('reviews')
      .insert({
        student_id: studentId,
        course_id: courseId,
        rating: rating,
        comment: comment,
        created_at: new Date()
      })
      .onConflict(['student_id', 'course_id'])
      .merge();
    
    const reviews = await trx('reviews')
      .where({ course_id: courseId })
      .select('rating');
    
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await trx('courses')
      .where({ id: courseId })
      .update({
        rating_avg: avgRating.toFixed(1),
        rating_count: reviews.length
      });
    
    await trx.commit();
    return { success: true, message: 'Đánh giá thành công!' };
  } catch (err) {
    await trx.rollback();
    throw err;
  }
};

export const getCourseReviews = async (courseId) => {
  return await database('reviews')
    .join('users', 'reviews.student_id', 'users.id')
    .where({ 'reviews.course_id': courseId })
    .select(
      'reviews.*',
      'users.fullname as student_name',
      'users.avatar as student_avatar'
    )
    .orderBy('reviews.created_at', 'desc');
};

export const updateProgress = async (studentId, courseId, progress) => {
  const completed = progress >= 100;
  return await database('enrollments')
    .where({ student_id: studentId, course_id: courseId })
    .update({
      progress: progress,
      completed_at: completed ? new Date() : null,
      last_accessed: new Date()
    });
};

export const getCourseLectures = async (studentId, courseId) => {
  const enrolled = await database('enrollments')
    .where({ student_id: studentId, course_id: courseId })
    .first();
  
  if (!enrolled) {
    return null;
  }
  
  return await database('sections')
    .where({ course_id: courseId })
    .orderBy('order_index', 'asc')
    .then(async sections => {
      for (let section of sections) {
        section.lectures = await database('lectures')
          .where({ section_id: section.id })
          .orderBy('order_index', 'asc')
          .select('*');
      }
      return sections;
    });
};
