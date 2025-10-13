import database from '../utils/database.js';

export const homeQueries = {
  async getFeaturedCourses() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { rows: courses } = await database.raw(
      `
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
        AND c.created_at >= ?
      ORDER BY c.enrollment_count DESC
      LIMIT 4
    `,
      [oneWeekAgo]
    );

    return courses;
  },

  async getMostViewedCourses() {
    const { rows: courses } = await database.raw(
      `
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
    `
    );

    return courses;
  },

  async getNewestCourses() {
    const { rows: courses } = await database.raw(
      `
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
    `
    );

    return courses;
  },

  async getTopCategoriesByEnrollments() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { rows: categories } = await database.raw(
      `
      SELECT
        cat.id,
        cat.name,
        cat.description,
        COALESCE(SUM(c.enrollment_count), 0) as enrollment_count,
        COUNT(c.id) as course_count
      FROM categories cat
      LEFT JOIN courses c ON cat.id = c.category_id
        AND c.created_at >= ?
        AND c.status = 'completed'
      WHERE cat.parent_id IS NULL
      GROUP BY cat.id, cat.name, cat.description
      ORDER BY enrollment_count DESC
      LIMIT 6
    `,
      [oneWeekAgo]
    );

    return categories;
  },

  async getAllParentCategories() {
    const { rows: categories } = await database.raw(
      `
      SELECT id, name, description
      FROM categories
      WHERE parent_id IS NULL
      ORDER BY name ASC
    `
    );

    return categories;
  },

  async getCategoriesWithChildren() {
    const { rows: parents } = await database.raw(
      `
      SELECT id, name, description
      FROM categories
      WHERE parent_id IS NULL
      ORDER BY name ASC
    `
    );

    for (const parent of parents) {
      const { rows: children } = await database.raw(
        `
        SELECT id, name, description
        FROM categories
        WHERE parent_id = ?
        ORDER BY name ASC
      `,
        [parent.id]
      );

      parent.children = children;
    }

    return parents;
  }
};
