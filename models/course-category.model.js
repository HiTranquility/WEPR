import database from "../utils/database.js";

export const baseQuery = database("course_categories");

export const createCourseCategory = async (courseCategory) => {
    return await baseQuery.insert(courseCategory);
};

export const readCourseCategory = async (id) => {
    return await baseQuery.where("id", id).first();
};

export const updateCourseCategory = async (id, courseCategory) => {
    return await baseQuery.where("id", id).update(courseCategory);
};

export const deleteCourseCategory = async (id) => {
    return await baseQuery.where("id", id).delete();
};

export const getAllCourseCategories = async () => {
    return await baseQuery.select("*");
};

export const getAllCourseCategoriesWithCount = async () => {
    const rows = await baseQuery.clone()
      .leftJoin("courses", "course_categories.id", "courses.category_id")
      .whereNull("course_categories.parent_id")
      .groupBy("course_categories.id", "course_categories.name", "course_categories.description")
      .select(
        "course_categories.id", 
        "course_categories.name", 
        "course_categories.description", 
        database.raw("COUNT(courses.id) as course_count"), 
        "course_categories.created_at", 
      );
    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        course_count: r.course_count,
        created_at: r.created_at,
    }));
};

export const getTopCategoriesByEnrollments = async () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await baseQuery.clone()
      .leftJoin("courses", "course_categories.id", "courses.category_id")
      .where("courses.created_at", ">=", oneWeekAgo)
      .where("courses.status", "completed")
      .whereNull("course_categories.parent_id")
      .groupBy("course_categories.id", "course_categories.name", "course_categories.description")
      .orderBy("course_count", "desc")
      .limit(6)
      .select(
        "course_categories.id", 
        "course_categories.name", 
        "course_categories.description", 
        database.raw("COUNT(courses.id) as course_count"), 
        "course_categories.created_at", 
      );
    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        course_count: r.course_count,
        created_at: r.created_at,
    }));
  };

  export const getCategoriesWithChildren = async () => {
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
  };