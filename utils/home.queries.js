import database from './database.js';

export const homeQueries = {
  async getFeaturedCourses() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return await database('courses as c')
      .select(
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
        database.raw('json_build_object(\'id\', u.id, \'full_name\', u.full_name, \'avatar_url\', u.avatar_url) as teacher'),
        database.raw('json_build_object(\'id\', cat.id, \'name\', cat.name) as category')
      )
      .join('users as u', 'c.teacher_id', 'u.id')
      .join('categories as cat', 'c.category_id', 'cat.id')
      .where('c.status', 'completed')
      .where('c.is_featured', true)
      .where('c.created_at', '>=', oneWeekAgo)
      .orderBy('c.enrollment_count', 'desc')
      .limit(4);
  },

  async getMostViewedCourses() {
    return await database('courses as c')
      .select(
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
        database.raw('json_build_object(\'id\', u.id, \'full_name\', u.full_name, \'avatar_url\', u.avatar_url) as teacher'),
        database.raw('json_build_object(\'id\', cat.id, \'name\', cat.name) as category')
      )
      .join('users as u', 'c.teacher_id', 'u.id')
      .join('categories as cat', 'c.category_id', 'cat.id')
      .where('c.status', 'completed')
      .orderBy('c.view_count', 'desc')
      .limit(10);
  },

  async getNewestCourses() {
    return await database('courses as c')
      .select(
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
        database.raw('json_build_object(\'id\', u.id, \'full_name\', u.full_name, \'avatar_url\', u.avatar_url) as teacher'),
        database.raw('json_build_object(\'id\', cat.id, \'name\', cat.name) as category')
      )
      .join('users as u', 'c.teacher_id', 'u.id')
      .join('categories as cat', 'c.category_id', 'cat.id')
      .where('c.status', 'completed')
      .orderBy('c.created_at', 'desc')
      .limit(10);
  },

  async getTopCategoriesByEnrollments() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return await database('categories as cat')
      .select(
        'cat.id',
        'cat.name',
        'cat.description',
        database.raw('COUNT(DISTINCT e.id) as enrollment_count'),
        database.raw('COUNT(DISTINCT c.id) as course_count')
      )
      .join('courses as c', 'c.category_id', 'cat.id')
      .join('enrollments as e', 'e.course_id', 'c.id')
      .where('e.enrolled_at', '>=', oneWeekAgo)
      .where('c.status', 'completed')
      .whereNull('cat.parent_id')
      .groupBy('cat.id', 'cat.name', 'cat.description')
      .orderBy('enrollment_count', 'desc')
      .limit(6);
  },

  async getAllParentCategories() {
    return await database('categories')
      .select('id', 'name', 'description')
      .whereNull('parent_id')
      .orderBy('name', 'asc');
  },

  async getCategoriesWithChildren() {
    const parents = await database('categories as parent')
      .select('parent.id', 'parent.name', 'parent.description')
      .whereNull('parent.parent_id')
      .orderBy('parent.name', 'asc');

    for (const parent of parents) {
      parent.children = await database('categories')
        .select('id', 'name', 'description')
        .where('parent_id', parent.id)
        .orderBy('name', 'asc');
    }

    return parents;
  }
};
