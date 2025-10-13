import sql from '../utils/database.js';

export const homeQueries = {
  async getFeaturedCourses() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const courses = await sql`
      SELECT
        c.id,
        c.title,
        c.short_description,
        c.thumbnail_url,
        c.price,
        c.discount_price,
        c.rating_avg,
        c.rating_count,
        c.enrollment_count,
        c.view_count,
        json_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'avatar_url', u.avatar_url
        ) as teacher,
        json_build_object(
          'id', cat.id,
          'name', cat.name
        ) as category
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.status = 'completed'
        AND c.is_featured = true
        AND c.created_at >= ${oneWeekAgo}
      ORDER BY c.enrollment_count DESC
      LIMIT 4
    `;

    return courses;
  },

  async getMostViewedCourses() {
    const courses = await sql`
      SELECT
        c.id,
        c.title,
        c.short_description,
        c.thumbnail_url,
        c.price,
        c.discount_price,
        c.rating_avg,
        c.rating_count,
        c.enrollment_count,
        c.view_count,
        json_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'avatar_url', u.avatar_url
        ) as teacher,
        json_build_object(
          'id', cat.id,
          'name', cat.name
        ) as category
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.status = 'completed'
      ORDER BY c.view_count DESC
      LIMIT 10
    `;

    return courses;
  },

  async getNewestCourses() {
    const courses = await sql`
      SELECT
        c.id,
        c.title,
        c.short_description,
        c.thumbnail_url,
        c.price,
        c.discount_price,
        c.rating_avg,
        c.rating_count,
        c.enrollment_count,
        c.view_count,
        c.created_at,
        json_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'avatar_url', u.avatar_url
        ) as teacher,
        json_build_object(
          'id', cat.id,
          'name', cat.name
        ) as category
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.status = 'completed'
      ORDER BY c.created_at DESC
      LIMIT 10
    `;

    return courses;
  },

  async getTopCategoriesByEnrollments() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const categories = await sql`
      SELECT
        cat.id,
        cat.name,
        cat.description,
        COALESCE(SUM(c.enrollment_count), 0) as enrollment_count,
        COUNT(c.id) as course_count
      FROM categories cat
      LEFT JOIN courses c ON cat.id = c.category_id
        AND c.created_at >= ${oneWeekAgo}
        AND c.status = 'completed'
      WHERE cat.parent_id IS NULL
      GROUP BY cat.id, cat.name, cat.description
      ORDER BY enrollment_count DESC
      LIMIT 6
    `;

    return categories;
  },

  async getAllParentCategories() {
    const categories = await sql`
      SELECT id, name, description
      FROM categories
      WHERE parent_id IS NULL
      ORDER BY name ASC
    `;

    return categories;
  },

  async getCategoriesWithChildren() {
    const parents = await sql`
      SELECT id, name, description
      FROM categories
      WHERE parent_id IS NULL
      ORDER BY name ASC
    `;

    for (const parent of parents) {
      const children = await sql`
        SELECT id, name, description
        FROM categories
        WHERE parent_id = ${parent.id}
        ORDER BY name ASC
      `;

      parent.children = children;
    }

    return parents;
  }
};
