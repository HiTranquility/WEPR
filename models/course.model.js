import database from "../utils/database.js";

export const baseQuery = database("courses");
//=================
//Courses 
//=================
//CRUD

export const createCourse = async (course) => {
  return await baseQuery.insert(course);
};

export const readCourse = async (id) => {
  return await baseQuery.where("id", id).first();
};

export const updateCourse = async (id, data) => {
  return await baseQuery.where("id", id).update(data);
};

export const deleteCourse = async (id) => {
  return await baseQuery.where("id", id).del();
};

export const getAllCourses = async () => {
  return await baseQuery.select("*");
};


// Landing page: exact output schema (no teacher_id/category_id)
const COURSE_WITH_NAMES = [
  "courses.id",
  "courses.title",
  "courses.short_description",
  "courses.thumbnail_url",
  "courses.price",
  "courses.discount_price",
  "courses.status",
  "courses.is_featured",
  "courses.view_count",
  "courses.enrollment_count",
  "courses.rating_avg",
  "courses.rating_count",
  // keep detailed_description out of landing selects to reduce payload
];

export const getAllCoursesWithNames = async () => {
  const rows = await baseQuery
    .clone()
    .leftJoin("categories as category", "courses.category_id", "category.id")
    .leftJoin("users as teacher", "courses.teacher_id", "teacher.id")
    .select(
      ...COURSE_WITH_NAMES,
      { teacher_name: "teacher.full_name" },
      { teacher_avatar_url: "teacher.avatar_url" },
      { category_name: "category.name" }
    );

  console.log("getAllCoursesWithNames:", rows);
  return rows;
};


//=================
// Landing page queries (moved from home.model.js)
//=================
export const homeQueries = {
  async getFeaturedCourses() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await baseQuery
      .clone()
      .leftJoin("users as teacher", "courses.teacher_id", "teacher.id")
      .leftJoin("categories as category", "courses.category_id", "category.id")
      .where("courses.status", "completed")
      .andWhere("courses.is_featured", true)
      .andWhere("courses.created_at", ">=", oneWeekAgo)
      .orderBy("courses.enrollment_count", "desc")
      .limit(4)
      .select(
        "courses.id",
        "courses.title",
        "courses.short_description",
        "courses.thumbnail_url",
        "courses.price",
        "courses.discount_price",
        "courses.rating_avg",
        "courses.rating_count",
        "courses.enrollment_count",
        "courses.view_count",
        { teacher_id: "teacher.id" },
        { teacher_full_name: "teacher.full_name" },
        { teacher_avatar_url: "teacher.avatar_url" },
        { category_id: "category.id" },
        { category_name: "category.name" }
      );

    return rows.map((r) => ({
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
      teacher: {
        id: r.teacher_id,
        full_name: r.teacher_full_name,
        avatar_url: r.teacher_avatar_url,
      },
      category: {
        id: r.category_id,
        name: r.category_name,
      },
    }));
  },

  async getMostViewedCourses() {
    const rows = await baseQuery
      .clone()
      .leftJoin("users as teacher", "courses.teacher_id", "teacher.id")
      .leftJoin("categories as category", "courses.category_id", "category.id")
      .where("courses.status", "completed")
      .orderBy("courses.view_count", "desc")
      .limit(10)
      .select(
        "courses.id",
        "courses.title",
        "courses.short_description",
        "courses.thumbnail_url",
        "courses.price",
        "courses.discount_price",
        "courses.rating_avg",
        "courses.rating_count",
        "courses.enrollment_count",
        "courses.view_count",
        { teacher_id: "teacher.id" },
        { teacher_full_name: "teacher.full_name" },
        { teacher_avatar_url: "teacher.avatar_url" },
        { category_id: "category.id" },
        { category_name: "category.name" }
      );

    return rows.map((r) => ({
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
      teacher: {
        id: r.teacher_id,
        full_name: r.teacher_full_name,
        avatar_url: r.teacher_avatar_url,
      },
      category: {
        id: r.category_id,
        name: r.category_name,
      },
    }));
  },

  async getNewestCourses() {
    const rows = await baseQuery
      .clone()
      .leftJoin("users as teacher", "courses.teacher_id", "teacher.id")
      .leftJoin("categories as category", "courses.category_id", "category.id")
      .where("courses.status", "completed")
      .orderBy("courses.created_at", "desc")
      .limit(10)
      .select(
        "courses.id",
        "courses.title",
        "courses.short_description",
        "courses.thumbnail_url",
        "courses.price",
        "courses.discount_price",
        "courses.rating_avg",
        "courses.rating_count",
        "courses.enrollment_count",
        "courses.view_count",
        "courses.created_at",
        { teacher_id: "teacher.id" },
        { teacher_full_name: "teacher.full_name" },
        { teacher_avatar_url: "teacher.avatar_url" },
        { category_id: "category.id" },
        { category_name: "category.name" }
      );

    return rows.map((r) => ({
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
      created_at: r.created_at,
      teacher: {
        id: r.teacher_id,
        full_name: r.teacher_full_name,
        avatar_url: r.teacher_avatar_url,
      },
      category: {
        id: r.category_id,
        name: r.category_name,
      },
    }));
  },

  async getTopCategoriesByEnrollments() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await database("categories as cat")
      .leftJoin("courses as c", "cat.id", "c.category_id")
      .whereNull("cat.parent_id")
      .groupBy("cat.id", "cat.name", "cat.description")
      .orderBy("enrollment_count", "desc")
      .limit(6)
      .select(
        "cat.id",
        "cat.name",
        "cat.description",
        database.raw(
          "COALESCE(SUM(CASE WHEN c.created_at >= ? AND c.status = ? THEN c.enrollment_count ELSE 0 END), 0) as enrollment_count",
          [oneWeekAgo, "completed"]
        ),
        database.raw("COUNT(c.id) as course_count")
      );

    return rows;
  },

  async getAllParentCategories() {
    const rows = await database("categories")
      .whereNull("parent_id")
      .orderBy("name", "asc")
      .select("id", "name", "description");

    return rows;
  },

  async getCategoriesWithChildren() {
    const parents = await database("categories")
      .whereNull("parent_id")
      .orderBy("name", "asc")
      .select("id", "name", "description");

    for (const parent of parents) {
      const children = await database("categories")
        .where("parent_id", parent.id)
        .orderBy("name", "asc")
        .select("id", "name", "description");
      parent.children = children;
    }

    return parents;
  }
};
