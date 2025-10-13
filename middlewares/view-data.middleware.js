import { homeQueries } from '../models/home.model.js';

export async function addGlobalViewData(req, res, next) {
  try {
    const allCategories = await homeQueries.getCategoriesWithChildren();

    res.locals.allCategories = allCategories;

    next();
  } catch (error) {
    console.error('Error loading global view data:', error);
    res.locals.allCategories = [];
    next();
  }
}
