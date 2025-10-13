import { supabase } from '../utils/database.js';

export const homeQueries = {
  async getFeaturedCourses() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        short_description,
        thumbnail_url,
        price,
        discount_price,
        rating_avg,
        rating_count,
        enrollment_count,
        view_count,
        teacher:users(id, full_name, avatar_url),
        category:categories(id, name)
      `)
      .eq('status', 'completed')
      .eq('is_featured', true)
      .gte('created_at', oneWeekAgo)
      .order('enrollment_count', { ascending: false })
      .limit(4);

    if (error) throw error;
    return data || [];
  },

  async getMostViewedCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        short_description,
        thumbnail_url,
        price,
        discount_price,
        rating_avg,
        rating_count,
        enrollment_count,
        view_count,
        teacher:users(id, full_name, avatar_url),
        category:categories(id, name)
      `)
      .eq('status', 'completed')
      .order('view_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  async getNewestCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        short_description,
        thumbnail_url,
        price,
        discount_price,
        rating_avg,
        rating_count,
        enrollment_count,
        view_count,
        created_at,
        teacher:users(id, full_name, avatar_url),
        category:categories(id, name)
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  async getTopCategoriesByEnrollments() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.rpc('get_top_categories_weekly', {
      week_ago: oneWeekAgo
    });

    if (error) {
      console.warn('RPC function not found, using fallback');
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, description')
        .is('parent_id', null)
        .limit(6);

      return (categories || []).map(cat => ({
        ...cat,
        enrollment_count: 0,
        course_count: 0
      }));
    }

    return data || [];
  },

  async getAllParentCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description')
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getCategoriesWithChildren() {
    const { data: parents, error: parentsError } = await supabase
      .from('categories')
      .select('id, name, description')
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (parentsError) throw parentsError;

    for (const parent of parents || []) {
      const { data: children, error: childrenError } = await supabase
        .from('categories')
        .select('id, name, description')
        .eq('parent_id', parent.id)
        .order('name', { ascending: true });

      if (childrenError) throw childrenError;
      parent.children = children || [];
    }

    return parents || [];
  }
};
