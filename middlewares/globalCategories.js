import { getCategoriesWithChildren } from '../models/course-category.model.js';

let cache = { value: null, expires: 0 };

export default async function globalCategories(req, res, next) {

  try {
    const now = Date.now();
    if (!cache.value || cache.expires < now) {
      // Fetch parent->children tree (no counts to keep it light)
      const cats = await getCategoriesWithChildren({ includeCounts: false });

      cache.value = Array.isArray(cats) ? cats : [];
      cache.expires = now + 1000 * 60 * 5; // cache 5 minutes
    }

    // Expose in a `global_categories` object to match templates
  res.locals.global_categories = { allCategories: cache.value };
  // Expose a handy count and add a debug response header so the browser can show it in Network tab
  const cnt = Array.isArray(cache.value) ? cache.value.length : 0;
  res.locals.global_categories_count = cnt;
  try { res.setHeader('X-Categories-Count', String(cnt)); } catch (_) {}
  
    next();
  } catch (err) {
    next(err);
  }
}
