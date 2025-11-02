import database from "../utils/database.js";
import { getCategoryWithChildren } from './course-category.model.js';
// 🔹 Tạo course mới
export async function createCourse(course) {
  const payload = {
    ...course,
    description: course.description ?? course.detailed_description ?? course.short_description ?? ''
  };
  const [id] = await database("courses").insert(payload).returning("id");
  return id;
}

// 🔹 Đọc course theo ID
export async function readCourse(id) {
  return await database("courses")
    .where("id", id)
    .first();
}

// 🔹 Cập nhật course
export async function updateCourse(id, data) {
  const payload = {
    ...data,
    description: data?.description ?? data?.detailed_description ?? data?.short_description ?? undefined
  };
  if (payload.description === undefined) delete payload.description;
  return await database("courses")
    .where("id", id)
    .update(payload);
}

// 🔹 Xoá course (hard delete)
export async function deleteCourse(id) {
  return await database("courses")
    .where("id", id)
    .del();
}

// 🔹 Lấy tất cả courses
export async function getAllCourses({ includeJoins = false } = {}) {
  const query = database("courses");

  if (includeJoins) {
    query
      .leftJoin("users as teacher", "courses.teacher_id", "teacher.id")
      .leftJoin("categories as category", "courses.category_id", "category.id")
      .select(
        "courses.*",
        { teacher_name: "teacher.full_name" },
        { category_name: "category.name" }
      );
  } else {
    query.select("*");
  }
  return await query;
}

export async function searchCourses(opts = {}) {
  const {
    q,
    categoryId,
    subCategoryId,
    categoryIds: explicitCategoryIds,
    teacherId,
    minPrice,
    maxPrice,
    minRating,
    onlyDiscounted,
    isFeatured,
    status = 'completed',
    sortBy = 'popular',
    page = 1,
    limit = 12,
  } = opts;

  const p = Math.max(1, +page || 1);
  const l = Math.min(50, Math.max(1, +limit || 12));
  const offset = (p - 1) * l;

  // 🧭 Chuẩn bị danh sách categoryId (cha + con)
  let categoryIds = [];

  if (explicitCategoryIds) {
    let rawValue = explicitCategoryIds;

    // 🪄 Bước 1: Giải mã URL nếu bị encode (%2C → ,)
    if (typeof rawValue === 'string') {
      rawValue = decodeURIComponent(rawValue);
    }

    // 🧩 Bước 2: Chuẩn hóa thành mảng UUID thật
    if (Array.isArray(rawValue)) {
      // Nếu là mảng (category[]=id1&category[]=id2)
      categoryIds = rawValue.flatMap(id =>
        id.split(',').map(i => i.trim()).filter(Boolean)
      );
    } else if (typeof rawValue === 'string') {
      // Nếu là chuỗi (category=id1,id2)
      categoryIds = rawValue.split(',').map(id => id.trim()).filter(Boolean);
    }
  }

  // 🧩 Bước 3: Nếu chưa có ID con, lấy ID con từ DB
  if (categoryIds.length === 0 && subCategoryId) {
    categoryIds = [subCategoryId];
  } else if (categoryIds.length === 0 && categoryId) {
    categoryIds = await getCategoryWithChildren(categoryId);
    if (!categoryIds || categoryIds.length === 0) categoryIds = [categoryId];
  }





  if (categoryIds.length === 0 && subCategoryId) {
    categoryIds = [subCategoryId];
  } else if (categoryIds.length === 0 && categoryId) {
    categoryIds = await getCategoryWithChildren(categoryId);
    if (!categoryIds || categoryIds.length === 0) categoryIds = [categoryId];
  }

  // Base query
  const query = database('courses')
    .leftJoin('users as teacher', 'courses.teacher_id', 'teacher.id')
    .leftJoin('categories as category', 'courses.category_id', 'category.id')
    .where((builder) => {
      // 🔹 Trạng thái khóa học
      if (status) builder.where('courses.status', status);

      // 🔹 Featured
      if (isFeatured != null) builder.andWhere('courses.is_featured', !!isFeatured);

      // 🔹 Category filter
      if (categoryIds && categoryIds.length > 0) {
        builder.where(function (qb) {
          qb.whereIn('courses.category_id', categoryIds);
        });
      }

      // 🔹 Teacher
      if (teacherId) builder.andWhere('courses.teacher_id', teacherId);

      // 🔹 Discount filter
      if (onlyDiscounted)
        builder.andWhereRaw('courses.discount_price IS NOT NULL AND courses.discount_price < courses.price');

      // 🔹 Price filter (dùng COALESCE để lấy discount nếu có)
      if (minPrice != null && maxPrice != null) {
        builder.andWhereRaw(
          `COALESCE(NULLIF(courses.discount_price, 0), courses.price)::numeric BETWEEN ? AND ?`,
          [minPrice, maxPrice]
        );
      } else if (minPrice != null) {
        builder.andWhereRaw(
          `COALESCE(NULLIF(courses.discount_price, 0), courses.price)::numeric >= ?`,
          [minPrice]
        );
      } else if (maxPrice != null) {
        builder.andWhereRaw(
          `COALESCE(NULLIF(courses.discount_price, 0), courses.price)::numeric <= ?`,
          [maxPrice]
        );
      }

      // 🔹 Rating filter — loại bỏ khóa chưa có đánh giá
      if (minRating != null) {
        builder.andWhere(function (qb) {
          qb.where('courses.rating_avg', '>=', minRating)
            .andWhere('courses.rating_count', '>', 0)
            .whereNotNull('courses.rating_avg'); // ✅ dùng whereNotNull thay vì andWhereNotNull
        });
      }



      // 🔹 FULL-TEXT SEARCH
      if (q?.trim()) {
        const term = q.trim();
        try {
          const isPg =
            database?.client?.config?.client === 'pg';
          if (isPg) {
            const cleaned = term.replace(/[^\w\s]/g, '').trim();
            if (cleaned.length < 3) {
              const kw = `%${cleaned}%`;
              builder.andWhere((sub) => {
                sub.whereILike('courses.title', kw)
                  .orWhereILike('courses.short_description', kw)
                  .orWhereILike('category.name', kw)
                  .orWhereILike('teacher.full_name', kw);
              });
            } else {
              const tsquery = cleaned.split(/\s+/).map((w) => `${w}:*`).join(' & ');
              builder.andWhereRaw(
                `to_tsvector('english', 
                  coalesce(courses.title,'') || ' ' || 
                  coalesce(courses.short_description,'') || ' ' || 
                  coalesce(category.name,'') || ' ' || 
                  coalesce(teacher.full_name,'')
                ) @@ to_tsquery('english', ?)`,
                [tsquery]
              );
            }
          } else {
            const kw = `%${term}%`;
            builder.andWhere((sub) => {
              sub.whereILike('courses.title', kw)
                .orWhereILike('courses.short_description', kw)
                .orWhereILike('category.name', kw)
                .orWhereILike('teacher.full_name', kw);
            });
          }
        } catch {
          const kw = `%${term}%`;
          builder.andWhere((sub) => {
            sub.whereILike('courses.title', kw)
              .orWhereILike('courses.short_description', kw)
              .orWhereILike('category.name', kw)
              .orWhereILike('teacher.full_name', kw);
          });
        }
      }
    });

  // 🔹 Đếm tổng số khóa học
  const [{ total = 0 }] = await query.clone().clearSelect().countDistinct({ total: 'courses.id' });

  // 🔹 Sắp xếp theo lựa chọn người dùng
  switch (sortBy) {
    case 'newest':
      query.orderBy('courses.created_at', 'desc');
      break;
    case 'price_asc':
      // Sort theo giá thực tế (discount_price nếu có, nếu không thì dùng price)
      query.orderByRaw('COALESCE(courses.discount_price, courses.price) ASC');
      break;
    case 'price_desc':
      // Sort theo giá thực tế (discount_price nếu có, nếu không thì dùng price)
      query.orderByRaw('COALESCE(courses.discount_price, courses.price) DESC');
      break;
    case 'rating':
    case 'top-rated':
      query.orderBy([
        { column: 'courses.rating_avg', order: 'desc' },
        { column: 'courses.rating_count', order: 'desc' },
      ]);
      break;
    case 'newest':
      query.orderBy('courses.created_at', 'desc');
      break;
    case 'price-low':
    case 'price_asc':
      query.orderByRaw(
        `COALESCE(NULLIF(courses.discount_price, 0), courses.price)::numeric ASC`
      );
      break;
    case 'price-high':
    case 'price_desc':
      query.orderByRaw(
        `COALESCE(NULLIF(courses.discount_price, 0), courses.price)::numeric DESC`
      );
      break;
    default:
      query.orderBy('courses.enrollment_count', 'desc');
  }

  // 🔹 Truy vấn dữ liệu
  const rows = await query
    .select(
      'courses.id',
      'courses.title',
      'courses.short_description',
      'courses.thumbnail_url',
      'courses.price',
      'courses.discount_price',
      'courses.rating_avg',
      'courses.rating_count',
      'courses.enrollment_count',
      'courses.view_count',
      'courses.is_featured',
      'courses.created_at',
      { category_id: 'category.id' },
      { category_name: 'category.name' },
      { teacher_id: 'teacher.id' },
      { teacher_full_name: 'teacher.full_name' },
      { teacher_avatar_url: 'teacher.avatar_url' }
    )
    .limit(l)
    .offset(offset);

  // 🔹 Trả kết quả
  return {
    data: rows.map((r) => ({
      id: r.id,
      title: r.title,
      short_description: r.short_description,
      thumbnail_url: r.thumbnail_url,
      price: r.price,
      discount_price: r.discount_price,
      rating_avg: r.rating_avg,
      rating_count: r.rating_count,
      enrollment_count: r.enrollment_count,
      view_count: r.view_count,
      is_featured: r.is_featured,
      created_at: r.created_at,
      category: { id: r.category_id, name: r.category_name },
      teacher: { id: r.teacher_id, full_name: r.teacher_full_name, avatar_url: r.teacher_avatar_url },
    })),
    pagination: {
      page: p,
      limit: l,
      total: +total,
      totalPages: Math.max(1, Math.ceil(+total / l)),
    },
  };
}



// 🔹 Chi tiết khoá học (join teacher, category) theo shape của view detail
export async function getCourseDetail(courseId) {
  const courseRow = await database('courses as c')
    .leftJoin('users as t', 'c.teacher_id', 't.id')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .where('c.id', courseId)
    .first(
      'c.*',
      database.ref('t.full_name').as('teacher_full_name'),
      database.ref('t.avatar_url').as('teacher_avatar_url'),
      database.ref('t.bio').as('teacher_bio'),
      database.ref('cat.name').as('category_name')
    );
  if (!courseRow) return null;

  const [teacherStats] = await database('courses')
    .where('teacher_id', courseRow.teacher_id)
    .select(
      database.raw('COUNT(*) as total_courses'),
      database.raw('COALESCE(SUM(enrollment_count), 0) as total_students'),
      database.raw('COALESCE(AVG(rating_avg), 0) as teacher_rating_avg')
    );

  const sections = await database('sections')
    .where('course_id', courseId)
    .orderBy('order_index', 'asc')
    .select('id', 'title', 'order_index');

  const lectures = sections.length > 0
    ? await database('lectures')
        .whereIn('section_id', sections.map(s => s.id))
        .orderBy('order_index', 'asc')
        .select('id', 'section_id', 'title', 'video_url', 'duration', 'is_preview', 'order_index')
    : [];

  const formatMinutes = (mins) => {
    if (!mins || Number.isNaN(Number(mins))) return '';
    const total = Number(mins);
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    if (hours && minutes) return `${hours} giờ ${minutes} phút`;
    if (hours) return `${hours} giờ`;
    return `${minutes} phút`;
  };

  const sectionMap = new Map();
  sections.forEach(section => {
    sectionMap.set(section.id, {
      id: section.id,
      title: section.title,
      order: section.order_index || 0,
      lectures: [],
      duration_minutes: 0,
      duration_text: ''
    });
  });

  let totalLectures = 0;
  let totalDurationMinutes = 0;

  lectures.forEach(lecture => {
    const minutes = Number(lecture.duration || 0);
    const section = sectionMap.get(lecture.section_id);
    if (!section) return;

    section.lectures.push({
      id: lecture.id,
      title: lecture.title,
      duration_minutes: minutes,
      duration_text: formatMinutes(minutes),
      order: lecture.order_index || 0,
      is_preview: !!lecture.is_preview,
      video_url: lecture.video_url || ''
    });

    section.duration_minutes += minutes;
    totalLectures += 1;
    totalDurationMinutes += minutes;
  });

  const structuredSections = Array.from(sectionMap.values())
    .sort((a, b) => a.order - b.order)
    .map(section => ({
      ...section,
      duration_text: formatMinutes(section.duration_minutes),
      lectures: section.lectures.sort((a, b) => a.order - b.order),
      preview_lecture: section.lectures.find(l => l.is_preview) || null
    }));

  const previewLectures = structuredSections.flatMap(section => section.lectures.filter(l => l.is_preview));
  const firstPreview = previewLectures.length ? previewLectures[0] : null;

  const totalDurationText = formatMinutes(totalDurationMinutes);

  return {
    id: courseRow.id,
    title: courseRow.title,
    short_description: courseRow.short_description,
    full_description: courseRow.detailed_description || '',
    thumbnail_url: courseRow.thumbnail_url,
    price: Number(courseRow.price || 0),
    discount_price: Number(courseRow.discount_price ?? courseRow.price ?? 0),
    rating_avg: Number(courseRow.rating_avg || 0),
    rating_count: Number(courseRow.rating_count || 0),
    enrollment_count: Number(courseRow.enrollment_count || 0),
    view_count: Number(courseRow.view_count || 0),
    created_at: courseRow.created_at,
    updated_at: courseRow.updated_at,
    category: { id: courseRow.category_id || null, name: courseRow.category_name || 'Khác' },
    teacher: {
      id: courseRow.teacher_id || null,
      full_name: courseRow.teacher_full_name || 'Giảng viên',
      avatar_url: courseRow.teacher_avatar_url || '',
      bio: courseRow.teacher_bio || '',
      rating_avg: Number(teacherStats?.teacher_rating_avg || 0),
      total_students: Number(teacherStats?.total_students || 0),
      total_courses: Number(teacherStats?.total_courses || 0)
    },
    sections: structuredSections,
    preview_lectures: previewLectures,
    preview_lecture: firstPreview,
    total_lectures: totalLectures,
    total_duration: totalDurationText,
    total_resources: 0,
    what_you_will_learn: []
  };
}

// 🔹 Khóa học liên quan theo category (loại trừ chính nó)
export async function getRelatedCourses(courseId, categoryId, limit = 6) {
  const rows = await database('courses as c')
    .leftJoin('users as t', 'c.teacher_id', 't.id')
    .where('c.category_id', categoryId)
    .andWhere('c.id', '!=', courseId)
    .orderBy([{ column: 'c.enrollment_count', order: 'desc' }, { column: 'c.view_count', order: 'desc' }])
    .limit(limit)
    .select(
      'c.id', 'c.title', 'c.thumbnail_url', 'c.discount_price', 'c.rating_avg', 'c.rating_count', 'c.enrollment_count',
      database.ref('t.full_name').as('teacher_full_name'),
      database.ref('t.avatar_url').as('teacher_avatar_url')
    );
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    thumbnail_url: r.thumbnail_url,
    rating_avg: r.rating_avg,
    rating_count: r.rating_count,
    discount_price: r.discount_price,
    enrollment_count: r.enrollment_count,
    teacher: { full_name: r.teacher_full_name, avatar_url: r.teacher_avatar_url }
  }));
}

//=================
// LANDING PAGE DATA
//=================

export const getLandingData = async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const COURSE_COLUMNS = [
    'c.id',
    'c.title',
    'c.short_description',
    'c.thumbnail_url',
    'c.price',
    'c.discount_price',
    'c.rating_avg',
    'c.rating_count',
    'c.enrollment_count',
    'c.view_count',
    'c.created_at',
    database.ref('t.full_name').as('teacher_full_name'),
    database.ref('t.avatar_url').as('teacher_avatar'),
    database.ref('cat.name').as('category_name'),
  ];

  const formatCourseRow = (row) => ({
    id: row.id,
    title: row.title,
    short_description: row.short_description,
    thumbnail_url: row.thumbnail_url,
    price: row.price,
    discount_price: row.discount_price,
    rating_avg: row.rating_avg,
    rating_count: row.rating_count,
    enrollment_count: row.enrollment_count,
    view_count: row.view_count,
    created_at: row.created_at,
    teacher: {
      full_name: row.teacher_full_name,
      avatar_url: row.teacher_avatar,
    },
    category: row.category_name ? { name: row.category_name } : null,
  });

  const mergeUnique = (primary, fallback, limit) => {
    const map = new Map();
    primary.forEach((item) => {
      if (item?.id && !map.has(item.id)) map.set(item.id, item);
    });
    fallback.forEach((item) => {
      if (map.size >= limit) return;
      if (item?.id && !map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values()).slice(0, limit);
  };

  // Featured courses (top 3 this week, fallback older)
  const featuredPrimary = await database('courses as c')
    .leftJoin('users as t', 'c.teacher_id', 't.id')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .select(COURSE_COLUMNS)
    .where('c.status', 'completed')
    .andWhere('c.is_featured', true)
    .andWhere('c.created_at', '>=', oneWeekAgo)
    .orderBy('c.enrollment_count', 'desc')
    .orderBy('c.rating_avg', 'desc')
    .limit(3);

  const featuredFallback = featuredPrimary.length < 3
    ? await database('courses as c')
        .leftJoin('users as t', 'c.teacher_id', 't.id')
        .leftJoin('categories as cat', 'c.category_id', 'cat.id')
        .select(COURSE_COLUMNS)
        .where('c.status', 'completed')
        .andWhere('c.is_featured', true)
        .orderBy('c.enrollment_count', 'desc')
        .orderBy('c.rating_avg', 'desc')
        .limit(5)
    : [];

  const featuredExtra = featuredPrimary.length + featuredFallback.length < 3
    ? await database('courses as c')
        .leftJoin('users as t', 'c.teacher_id', 't.id')
        .leftJoin('categories as cat', 'c.category_id', 'cat.id')
        .select(COURSE_COLUMNS)
        .where('c.status', 'completed')
        .orderBy('c.rating_avg', 'desc')
        .orderBy('c.enrollment_count', 'desc')
        .limit(5)
    : [];

  const featuredCourses = mergeUnique(featuredPrimary, [...featuredFallback, ...featuredExtra], 3).map(formatCourseRow);

  // Most viewed courses (top 10 overall, fallback include all statuses)
  const mostViewedPrimary = await database('courses as c')
    .leftJoin('users as t', 'c.teacher_id', 't.id')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .select(COURSE_COLUMNS)
    .where('c.status', 'completed')
    .orderBy('c.view_count', 'desc')
    .orderBy('c.rating_avg', 'desc')
    .limit(10);

  const mostViewedFallback = mostViewedPrimary.length < 10
    ? await database('courses as c')
        .leftJoin('users as t', 'c.teacher_id', 't.id')
        .leftJoin('categories as cat', 'c.category_id', 'cat.id')
        .select(COURSE_COLUMNS)
        .orderBy('c.view_count', 'desc')
        .orderBy('c.rating_avg', 'desc')
        .limit(12)
    : [];

  const mostViewedCourses = mergeUnique(mostViewedPrimary, mostViewedFallback, 10).map(formatCourseRow);

  // Newest courses (top 10 newest completed, fallback include all statuses)
  const newestPrimary = await database('courses as c')
    .leftJoin('users as t', 'c.teacher_id', 't.id')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .select(COURSE_COLUMNS)
    .where('c.status', 'completed')
    .orderBy('c.created_at', 'desc')
    .limit(10);

  const newestFallback = newestPrimary.length < 10
    ? await database('courses as c')
        .leftJoin('users as t', 'c.teacher_id', 't.id')
        .leftJoin('categories as cat', 'c.category_id', 'cat.id')
        .select(COURSE_COLUMNS)
        .orderBy('c.created_at', 'desc')
        .limit(12)
    : [];

  const newestCourses = mergeUnique(newestPrimary, newestFallback, 10).map(formatCourseRow);

  // Top categories (enrollments this week, fallback by total courses)
  const topCategoriesPrimary = await database('categories as cat')
    .leftJoin('courses as c', 'cat.id', 'c.category_id')
    .leftJoin('enrollments as e', function() {
      this.on('c.id', '=', 'e.course_id')
        .andOn('e.enrolled_at', '>=', database.raw('?', [oneWeekAgo]));
    })
    .groupBy('cat.id', 'cat.name')
    .select(
      'cat.id',
      'cat.name',
      database.raw('COUNT(DISTINCT e.id) AS enrollment_count'),
      database.raw('COUNT(DISTINCT c.id) AS course_count')
    )
    .orderBy('enrollment_count', 'desc')
    .limit(5);

  const topCategoriesFallback = topCategoriesPrimary.length < 5
    ? await database('categories as cat')
        .leftJoin('courses as c', 'cat.id', 'c.category_id')
        .groupBy('cat.id', 'cat.name')
        .select(
          'cat.id',
          'cat.name',
          database.raw('COUNT(DISTINCT c.id) AS course_count'),
          database.raw('COALESCE(SUM(c.enrollment_count), 0) AS enrollment_count')
        )
        .orderBy('enrollment_count', 'desc')
        .limit(6)
    : [];

  const topCategories = mergeUnique(topCategoriesPrimary, topCategoriesFallback, 5).map((cat) => ({
    id: cat.id,
    name: cat.name,
    course_count: Number(cat.course_count || 0),
    enrollment_count: Number(cat.enrollment_count || 0),
  }));

  // All categories for header
  const allCategories = await database('categories')
    .select('id', 'name')
    .orderBy('name', 'asc');

  return {
    featuredCourses,
    mostViewedCourses,
    newestCourses,
    topCategories,
    allCategories,
  };
};

//=================
// COURSE - PREVIEW LECTURE DETAIL
//=================
export const getLecturePreview = async (courseId, lectureId) => {
  const result = await database('lectures as l')
    .leftJoin('sections as s', 'l.section_id', 's.id')
    .leftJoin('courses as c', 's.course_id', 'c.id')
    .leftJoin('users as t', 'c.teacher_id', 't.id')
    .where('l.id', lectureId)
    .andWhere('c.id', courseId)
    // Bỏ điều kiện is_preview để cho phép xem tất cả lectures
    .first(
      'l.id as lecture_id',
      'l.title as lecture_title',
      'l.video_url',
      'l.duration',
      'l.is_preview',
      's.id as section_id',
      's.title as section_title',
      'c.id as course_id',
      'c.title as course_title',
      't.full_name as teacher_name',
      't.avatar_url as teacher_avatar'
    );

  return result || null;
};
export async function getTop3FeaturedCoursesThisWeek() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return await database('courses')
    .leftJoin('users as teacher', 'courses.teacher_id', 'teacher.id')
    .leftJoin('categories as category', 'courses.category_id', 'category.id')
    .where('courses.status', 'completed')
    .where('courses.is_featured', true)
    .where('courses.created_at', '>=', oneWeekAgo)
    .select(
      'courses.*',
      'teacher.full_name as teacher_name',
      'teacher.avatar_url as teacher_avatar',
      'category.name as category_name'
    )
    .orderBy('courses.enrollment_count', 'desc')
    .orderBy('courses.rating_avg', 'desc')
    .limit(3);
}

export async function getTop10MostViewedCourses() {
  return await database('courses')
    .leftJoin('users as teacher', 'courses.teacher_id', 'teacher.id')
    .leftJoin('categories as category', 'courses.category_id', 'category.id')
    .where('courses.status', 'completed')
    .select(
      'courses.*',
      'teacher.full_name as teacher_name',
      'teacher.avatar_url as teacher_avatar',
      'category.name as category_name'
    )
    .orderBy('courses.view_count', 'desc')
    .orderBy('courses.rating_avg', 'desc')
    .limit(10);
}

export async function getTop10NewestCourses() {
  return await database('courses')
    .leftJoin('users as teacher', 'courses.teacher_id', 'teacher.id')
    .leftJoin('categories as category', 'courses.category_id', 'category.id')
    .where('courses.status', 'completed')
    .select(
      'courses.*',
      'teacher.full_name as teacher_name',
      'teacher.avatar_url as teacher_avatar',
      'category.name as category_name'
    )
    .orderBy('courses.created_at', 'desc')
    .limit(10);
}

export async function getTop5CategoriesByEnrollmentsThisWeek() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return await database('categories')
    .leftJoin('courses', 'categories.id', 'courses.category_id')
    .leftJoin('enrollments', function() {
      this.on('courses.id', '=', 'enrollments.course_id')
        .andOn('enrollments.enrolled_at', '>=', database.raw('?', [oneWeekAgo]));
    })
    .where('categories.parent_id', null)
    .groupBy('categories.id', 'categories.name')
    .select(
      'categories.id',
      'categories.name',
      database.raw('COUNT(DISTINCT enrollments.id) as enrollment_count')
    )
    .orderBy('enrollment_count', 'desc')
    .limit(5);
}
