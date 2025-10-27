import database from "../utils/database.js";

// 🔹 Tạo course mới
export async function createCourse(course) {
  const [id] = await database("courses").insert(course).returning("id");
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
  return await database("courses")
    .where("id", id)
    .update(data);
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
    teacherId,
    minPrice,
    maxPrice,
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

  // Base query: join sẵn
  const query = database('courses')
    .leftJoin('users as teacher', 'courses.teacher_id', 'teacher.id')
    .leftJoin('categories as category', 'courses.category_id', 'category.id')
    .where(builder => {
      if (status) builder.where('courses.status', status);
      if (isFeatured != null) builder.andWhere('courses.is_featured', !!isFeatured);
      if (categoryId) builder.andWhere('courses.category_id', categoryId);
      if (teacherId) builder.andWhere('courses.teacher_id', teacherId);
      if (onlyDiscounted) builder.andWhereNotNull('courses.discount_price');
      if (minPrice != null) builder.andWhere('courses.price', '>=', minPrice);
      if (maxPrice != null) builder.andWhere('courses.price', '<=', maxPrice);
      if (q?.trim()) {
        const kw = `%${q.trim()}%`;
        builder.andWhere(sub => {
          sub.whereILike('courses.title', kw)
            .orWhereILike('courses.short_description', kw)
            .orWhereILike('category.name', kw)
            .orWhereILike('teacher.full_name', kw);
        });
      }
    });

  // Đếm tổng theo khóa chính để tránh ambiguous id
  const [{ total = 0 }] = await query.clone().clearSelect().countDistinct({ total: 'courses.id' });

  // Sắp xếp
  switch (sortBy) {
    case 'newest':
      query.orderBy('courses.created_at', 'desc');
      break;
    case 'price_asc':
      query.orderBy('courses.price', 'asc');
      break;
    case 'price_desc':
      query.orderBy('courses.price', 'desc');
      break;
    case 'rating':
      query.orderBy([
        { column: 'courses.rating_avg', order: 'desc' },
        { column: 'courses.rating_count', order: 'desc' },
      ]);
      break;
    case 'sold':
      query.orderBy('courses.enrollment_count', 'desc');
      break;
    case 'popular':
    default:
      query.orderBy([
        { column: 'courses.view_count', order: 'desc' },
        { column: 'courses.enrollment_count', order: 'desc' },
      ]);
  }

  // Lấy dữ liệu trang hiện tại
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
      { category_id: 'category.id' },
      { category_name: 'category.name' },
      { teacher_id: 'teacher.id' },
      { teacher_full_name: 'teacher.full_name' },
      { teacher_avatar_url: 'teacher.avatar_url' },
    )
    .limit(l)
    .offset(offset);

  // Trả kết quả
  return {
    data: rows.map(r => ({
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
  const r = await database('courses as c')
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
  if (!r) return null;
  // Aggregate teacher stats
  const [stats] = await database('courses')
    .where('teacher_id', r.teacher_id)
    .select(
      database.raw('COUNT(*) as total_courses'),
      database.raw('COALESCE(SUM(enrollment_count), 0) as total_students'),
      database.raw('COALESCE(AVG(rating_avg), 0) as teacher_rating_avg')
    );
  return {
    id: r.id,
    title: r.title,
    short_description: r.short_description,
    full_description: r.detailed_description || '',
    thumbnail_url: r.thumbnail_url,
    price: Number(r.price || 0),
    discount_price: Number(r.discount_price ?? r.price ?? 0),
    rating_avg: Number(r.rating_avg || 0),
    rating_count: Number(r.rating_count || 0),
    enrollment_count: Number(r.enrollment_count || 0),
    view_count: Number(r.view_count || 0),
    created_at: r.created_at,
    updated_at: r.updated_at,
    category: { id: r.category_id || null, name: r.category_name || 'Khác' },
    teacher: {
      id: r.teacher_id || null,
      full_name: r.teacher_full_name || 'Giảng viên',
      avatar_url: r.teacher_avatar_url || '',
      bio: r.teacher_bio || '',
      rating_avg: Number(stats?.teacher_rating_avg || 0),
      total_students: Number(stats?.total_students || 0),
      total_courses: Number(stats?.total_courses || 0)
    },
    sections: [],
    total_lectures: 0,
    total_duration: '',
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
  // 🔹 Khóa học nổi bật
  const featuredCourses = await database("courses AS c")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .select(
      "c.id",
      "c.title",
      "c.short_description",
      "c.thumbnail_url",
      "c.price",
      "c.discount_price",
      "c.rating_avg",
      "c.rating_count",
      "c.enrollment_count",
      database.ref("t.full_name").as("teacher_full_name")
    )
    .where("c.is_featured", true)
    .orderBy("c.rating_avg", "desc")
    .limit(6);

  // 🔹 Khóa học xem nhiều
  const mostViewedCourses = await database("courses AS c")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .select(
      "c.id",
      "c.title",
      "c.thumbnail_url",
      "c.rating_avg",
      "c.rating_count",
      "c.price",
      "c.discount_price",
      "c.enrollment_count",
      "c.view_count",
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("t.avatar_url").as("teacher_avatar_url")
    )
    .orderBy("c.view_count", "desc")
    .limit(6);

  // 🔹 Khóa học mới nhất
  const newestCourses = await database("courses AS c")
    .leftJoin("categories AS cat", "c.category_id", "cat.id")
    .leftJoin("users AS t", "c.teacher_id", "t.id")
    .select(
      "c.id",
      "c.title",
      "c.thumbnail_url",
      "c.rating_avg",
      "c.rating_count",
      "c.price",
      "c.discount_price",
      "c.enrollment_count",
      "c.view_count",
      "c.created_at",
      database.ref("cat.name").as("category_name"),
      database.ref("t.full_name").as("teacher_full_name"),
      database.ref("t.avatar_url").as("teacher_avatar_url")
    )
    .orderBy("c.created_at", "desc")
    .limit(6);

  // 🔹 Top danh mục
  const topCategories = await database("categories AS cat")
    .leftJoin("courses AS c", "cat.id", "c.category_id")
    .groupBy("cat.id", "cat.name")
    .select(
      "cat.id",
      "cat.name",
      database.raw("COUNT(c.id) AS course_count"),
      database.raw("COALESCE(SUM(c.enrollment_count), 0) AS enrollment_count")
    )
    .orderBy("course_count", "desc")
    .limit(6);

  // 🔹 Danh mục dropdown
  const allCategories = await database("categories")
    .select("id", "name")
    .orderBy("name", "asc");

  return {
    featuredCourses: featuredCourses.map((c) => ({
      ...c,
      teacher: { full_name: c.teacher_full_name },
    })),
    mostViewedCourses: mostViewedCourses.map((c) => ({
      ...c,
      category: { name: c.category_name },
      teacher: {
        full_name: c.teacher_full_name,
        avatar_url: c.teacher_avatar_url,
      },
    })),
    newestCourses: newestCourses.map((c) => ({
      ...c,
      category: { name: c.category_name },
      teacher: {
        full_name: c.teacher_full_name,
        avatar_url: c.teacher_avatar_url,
      },
    })),
    topCategories,
    allCategories,
  };
};
