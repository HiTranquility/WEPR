import database from '../utils/database.js';

export const homeQueries = {
  async getFeaturedCourses() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const courses = await database('courses')
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
        'users.id as teacher_id',
        'users.full_name as teacher_name',
        'users.avatar_url as teacher_avatar',
        'categories.id as category_id',
        'categories.name as category_name'
      )
      .leftJoin('users', 'courses.teacher_id', 'users.id')
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .where('courses.status', 'completed')
      .where('courses.is_featured', true)
      .where('courses.created_at', '>=', oneWeekAgo)
      .orderBy('courses.enrollment_count', 'desc')
      .limit(4);

    return courses.map(course => ({
      id: course.id,
      title: course.title,
      short_description: course.short_description,
      thumbnail_url: course.thumbnail_url,
      price: course.price,
      discount_price: course.discount_price,
      rating_avg: course.rating_avg,
      rating_count: course.rating_count,
      enrollment_count: course.enrollment_count,
      view_count: course.view_count,
      teacher: {
        id: course.teacher_id,
        full_name: course.teacher_name,
        avatar_url: course.teacher_avatar
      },
      category: {
        id: course.category_id,
        name: course.category_name
      }
    }));
  },

  async getMostViewedCourses() {
    const courses = await database('courses')
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
        'users.id as teacher_id',
        'users.full_name as teacher_name',
        'users.avatar_url as teacher_avatar',
        'categories.id as category_id',
        'categories.name as category_name'
      )
      .leftJoin('users', 'courses.teacher_id', 'users.id')
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .where('courses.status', 'completed')
      .orderBy('courses.view_count', 'desc')
      .limit(10);

    return courses.map(course => ({
      id: course.id,
      title: course.title,
      short_description: course.short_description,
      thumbnail_url: course.thumbnail_url,
      price: course.price,
      discount_price: course.discount_price,
      rating_avg: course.rating_avg,
      rating_count: course.rating_count,
      enrollment_count: course.enrollment_count,
      view_count: course.view_count,
      teacher: {
        id: course.teacher_id,
        full_name: course.teacher_name,
        avatar_url: course.teacher_avatar
      },
      category: {
        id: course.category_id,
        name: course.category_name
      }
    }));
  },

  async getNewestCourses() {
    const courses = await database('courses')
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
        'courses.created_at',
        'users.id as teacher_id',
        'users.full_name as teacher_name',
        'users.avatar_url as teacher_avatar',
        'categories.id as category_id',
        'categories.name as category_name'
      )
      .leftJoin('users', 'courses.teacher_id', 'users.id')
      .leftJoin('categories', 'courses.category_id', 'categories.id')
      .where('courses.status', 'completed')
      .orderBy('courses.created_at', 'desc')
      .limit(10);

    return courses.map(course => ({
      id: course.id,
      title: course.title,
      short_description: course.short_description,
      thumbnail_url: course.thumbnail_url,
      price: course.price,
      discount_price: course.discount_price,
      rating_avg: course.rating_avg,
      rating_count: course.rating_count,
      enrollment_count: course.enrollment_count,
      view_count: course.view_count,
      created_at: course.created_at,
      teacher: {
        id: course.teacher_id,
        full_name: course.teacher_name,
        avatar_url: course.teacher_avatar
      },
      category: {
        id: course.category_id,
        name: course.category_name
      }
    }));
  },

  async getTopCategoriesByEnrollments() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const categories = await database('categories')
      .select(
        'categories.id',
        'categories.name',
        'categories.description',
        database.raw('COALESCE(SUM(courses.enrollment_count), 0) as enrollment_count'),
        database.raw('COUNT(courses.id) as course_count')
      )
      .leftJoin('courses', function() {
        this.on('categories.id', '=', 'courses.category_id')
            .andOn('courses.created_at', '>=', database.raw('?', [oneWeekAgo]))
            .andOn('courses.status', '=', database.raw('?', ['completed']));
      })
      .whereNull('categories.parent_id')
      .groupBy('categories.id', 'categories.name', 'categories.description')
      .orderBy('enrollment_count', 'desc')
      .limit(6);

    return categories;
  },

  async getAllParentCategories() {
    const categories = await database('categories')
      .select('id', 'name', 'description')
      .whereNull('parent_id')
      .orderBy('name', 'asc');

    return categories;
  },

  async getCategoriesWithChildren() {
    const parents = await database('categories')
      .select('id', 'name', 'description')
      .whereNull('parent_id')
      .orderBy('name', 'asc');

    for (const parent of parents) {
      const children = await database('categories')
        .select('id', 'name', 'description')
        .where('parent_id', parent.id)
        .orderBy('name', 'asc');

      parent.children = children;
    }

    return parents;
  }
};
