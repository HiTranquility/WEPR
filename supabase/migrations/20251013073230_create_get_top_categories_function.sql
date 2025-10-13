/*
  # Create RPC function for top categories by enrollments

  1. New Functions
    - `get_top_categories_weekly`
      - Returns top 6 categories by enrollment count in the last week
      - Joins categories, courses, and enrollments tables
      - Groups by category and counts enrollments

  2. Purpose
    - Get the most popular categories based on recent enrollments
    - Used for homepage to display trending categories
*/

CREATE OR REPLACE FUNCTION get_top_categories_weekly(week_ago timestamptz)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  enrollment_count bigint,
  course_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cat.id,
    cat.name,
    cat.description,
    COUNT(DISTINCT e.id) as enrollment_count,
    COUNT(DISTINCT c.id) as course_count
  FROM categories cat
  LEFT JOIN courses c ON c.category_id = cat.id AND c.status = 'completed'
  LEFT JOIN enrollments e ON e.course_id = c.id AND e.enrolled_at >= week_ago
  WHERE cat.parent_id IS NULL
  GROUP BY cat.id, cat.name, cat.description
  ORDER BY enrollment_count DESC
  LIMIT 6;
END;
$$;
