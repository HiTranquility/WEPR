import database from "../utils/database.js";

export const createCourse = async (teacherId, courseData) => {
  const { title, short_desc, full_desc, category_id, sub_category_id, price, discount_price, thumbnail_url } = courseData;
  
  return await database('courses')
    .insert({
      teacher_id: teacherId,
      title,
      short_desc,
      full_desc,
      category_id,
      sub_category_id,
      price: price || 0,
      discount_price: discount_price || null,
      thumbnail_url: thumbnail_url || '',
      status: 'incomplete',
      created_at: new Date(),
      last_updated: new Date()
    })
    .returning('*');
};

export const updateCourse = async (teacherId, courseId, courseData) => {
  return await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .update({
      ...courseData,
      last_updated: new Date()
    })
    .returning('*');
};

export const deleteCourse = async (teacherId, courseId) => {
  return await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .del();
};

export const getTeacherCourses = async (teacherId) => {
  return await database('courses')
    .where({ teacher_id: teacherId })
    .select('*')
    .orderBy('created_at', 'desc');
};

export const getCourseById = async (teacherId, courseId) => {
  return await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .first();
};

export const createSection = async (teacherId, courseId, sectionData) => {
  const course = await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .first();
  
  if (!course) {
    throw new Error('Không tìm thấy khóa học hoặc bạn không có quyền!');
  }
  
  const { title, order_index } = sectionData;
  
  return await database('sections')
    .insert({
      course_id: courseId,
      title,
      order_index: order_index || 1
    })
    .returning('*');
};

export const updateSection = async (teacherId, sectionId, sectionData) => {
  const section = await database('sections')
    .join('courses', 'sections.course_id', 'courses.id')
    .where({ 'sections.id': sectionId, 'courses.teacher_id': teacherId })
    .first();
  
  if (!section) {
    throw new Error('Không tìm thấy section hoặc bạn không có quyền!');
  }
  
  return await database('sections')
    .where({ id: sectionId })
    .update(sectionData)
    .returning('*');
};

export const deleteSection = async (teacherId, sectionId) => {
  const section = await database('sections')
    .join('courses', 'sections.course_id', 'courses.id')
    .where({ 'sections.id': sectionId, 'courses.teacher_id': teacherId })
    .first();
  
  if (!section) {
    throw new Error('Không tìm thấy section hoặc bạn không có quyền!');
  }
  
  return await database('sections')
    .where({ id: sectionId })
    .del();
};

export const createLecture = async (teacherId, sectionId, lectureData) => {
  const section = await database('sections')
    .join('courses', 'sections.course_id', 'courses.id')
    .where({ 'sections.id': sectionId, 'courses.teacher_id': teacherId })
    .first();
  
  if (!section) {
    throw new Error('Không tìm thấy section hoặc bạn không có quyền!');
  }
  
  const { title, video_url, duration, is_preview, order_index } = lectureData;
  
  return await database('lectures')
    .insert({
      section_id: sectionId,
      title,
      video_url,
      duration: duration || 0,
      is_preview: is_preview || false,
      order_index: order_index || 1
    })
    .returning('*');
};

export const updateLecture = async (teacherId, lectureId, lectureData) => {
  const lecture = await database('lectures')
    .join('sections', 'lectures.section_id', 'sections.id')
    .join('courses', 'sections.course_id', 'courses.id')
    .where({ 'lectures.id': lectureId, 'courses.teacher_id': teacherId })
    .first();
  
  if (!lecture) {
    throw new Error('Không tìm thấy lecture hoặc bạn không có quyền!');
  }
  
  return await database('lectures')
    .where({ id: lectureId })
    .update(lectureData)
    .returning('*');
};

export const deleteLecture = async (teacherId, lectureId) => {
  const lecture = await database('lectures')
    .join('sections', 'lectures.section_id', 'sections.id')
    .join('courses', 'sections.course_id', 'courses.id')
    .where({ 'lectures.id': lectureId, 'courses.teacher_id': teacherId })
    .first();
  
  if (!lecture) {
    throw new Error('Không tìm thấy lecture hoặc bạn không có quyền!');
  }
  
  return await database('lectures')
    .where({ id: lectureId })
    .del();
};

export const publishCourse = async (teacherId, courseId) => {
  const course = await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .first();
  
  if (!course) {
    throw new Error('Không tìm thấy khóa học!');
  }
  
  const sectionsCount = await database('sections')
    .where({ course_id: courseId })
    .count('* as count')
    .first();
  
  if (sectionsCount.count < 1) {
    throw new Error('Khóa học phải có ít nhất 1 section!');
  }
  
  return await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .update({
      status: 'completed',
      last_updated: new Date()
    })
    .returning('*');
};

export const getCourseSections = async (teacherId, courseId) => {
  const course = await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .first();
  
  if (!course) {
    return null;
  }
  
  return await database('sections')
    .where({ course_id: courseId })
    .orderBy('order_index', 'asc');
};

export const getSectionLectures = async (teacherId, sectionId) => {
  const section = await database('sections')
    .join('courses', 'sections.course_id', 'courses.id')
    .where({ 'sections.id': sectionId, 'courses.teacher_id': teacherId })
    .first();
  
  if (!section) {
    return null;
  }
  
  return await database('lectures')
    .where({ section_id: sectionId })
    .orderBy('order_index', 'asc');
};

export const getCourseStats = async (teacherId, courseId) => {
  const course = await database('courses')
    .where({ id: courseId, teacher_id: teacherId })
    .first();
  
  if (!course) {
    return null;
  }
  
  const enrollmentCount = await database('enrollments')
    .where({ course_id: courseId })
    .count('* as count')
    .first();
  
  const avgRating = await database('reviews')
    .where({ course_id: courseId })
    .avg('rating as avg')
    .first();
  
  const reviewCount = await database('reviews')
    .where({ course_id: courseId })
    .count('* as count')
    .first();
  
  return {
    course,
    enrollments: enrollmentCount.count,
    rating_avg: avgRating.avg ? parseFloat(avgRating.avg).toFixed(1) : 0,
    review_count: reviewCount.count
  };
};
