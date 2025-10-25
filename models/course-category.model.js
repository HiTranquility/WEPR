import database from "../utils/database.js";

export async function createCategory(category) {
  const [id] = await database("categories").insert(category).returning("id");
  return id;
}

export async function readCategory(id) {
  return await database("categories").where("id", id).first();
}

export async function updateCategory(id, data) {
  return await database("categories").where("id", id).update(data);
}

export async function deleteCategory(id) {
  return await database("categories").where("id", id).del();
}

export async function getAllCategories({ includeCounts = false } = {}) {
  const qb = database("categories");
  if (!includeCounts) return await qb.select("*").orderBy("name", "asc");

  const rows = await qb
    .leftJoin("courses", "categories.id", "courses.category_id")
    .groupBy("categories.id", "categories.name", "categories.description")
    .select(
      "categories.id",
      "categories.name",
      "categories.description",
      database.raw("COUNT(courses.id) as course_count"),
      "categories.created_at"
    )
    .orderBy("categories.name", "asc");
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    course_count: Number(r.course_count || 0),
    created_at: r.created_at
  }));
}

// Helper cho trang Courses: không có parent, trả tất cả categories
export async function getCategoriesForCourses() {
  return await database("categories")
    .orderBy("name", "asc")
    .select("id", "name", "description");
}

// Tree: categories với children (nếu cần)
export async function getCategoriesWithChildren() {
  // Không có parent-child trong schema hiện tại; trả danh sách phẳng
  return await database("categories")
    .orderBy("name", "asc")
    .select("id", "name", "description");
}