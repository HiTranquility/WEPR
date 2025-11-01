import database from "../utils/database.js";

export async function getCategoryWithChildren(rootId) {
  if (!rootId) return [];

  const rows = await database("categories").select("id", "parent_id");
  if (!rows || rows.length === 0) return [];

  const exists = rows.some((row) => row.id === rootId);
  if (!exists) return [];

  const childrenMap = rows.reduce((map, row) => {
    const parent = row.parent_id || null;
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent).push(row.id);
    return map;
  }, new Map());

  const result = [];
  const stack = [rootId];
  const visited = new Set();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    result.push(current);

    const children = childrenMap.get(current);
    if (children && children.length) {
      stack.push(...children);
    }
  }

  return result;
}

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
export async function getCategoriesWithChildren({ includeCounts = false } = {}) {
  // Build a parent -> children tree. categories table has parent_id.
  // If includeCounts is true, join courses to get counts per category.
  const qb = database('categories as c')
    .leftJoin('categories as p', 'c.parent_id', 'p.id')
    .select(
      'c.id',
      'c.name',
      'c.description',
      'c.parent_id'
    )
    .orderBy('c.name', 'asc');

  if (includeCounts) {
    // join courses to count per category
    qb.leftJoin('courses as co', 'c.id', 'co.category_id')
      .groupBy('c.id', 'c.name', 'c.description', 'c.parent_id')
      .select(database.raw('COUNT(co.id) as course_count'));
  }

  let rows = [];
  try {
    rows = await qb;
  } catch (err) {
    rows = [];
  }

  // build tree: parents (parent_id null) with children array
  const map = new Map();
  rows.forEach(r => {
    map.set(r.id, {
      id: r.id,
      name: r.name,
      description: r.description,
      parent_id: r.parent_id,
      course_count: includeCounts ? Number(r.course_count || 0) : undefined,
      children: []
    });
  });

  const roots = [];
  map.forEach(item => {
    if (item.parent_id) {
      const parent = map.get(item.parent_id);
      if (parent) parent.children.push(item);
      else roots.push(item); // orphaned, treat as root
    } else {
      roots.push(item);
    }
  });

  return roots;
}