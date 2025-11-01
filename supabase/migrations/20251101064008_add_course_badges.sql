/*
  # Add Course Badges

  1. Changes
    - Add badge column to courses table
    - Badge types: 'featured', 'new', 'discount', 'bestseller'
    - Update existing courses with sample badges
  
  2. Data
    - Mark top rated courses as 'featured'
    - Mark recent courses as 'new'
    - Mark discounted courses as 'discount'
    - Mark high enrollment courses as 'bestseller'
*/

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS badge TEXT CHECK (badge IN ('featured', 'new', 'discount', 'bestseller'));

UPDATE courses 
SET badge = 'featured' 
WHERE id IN (
  SELECT id FROM courses 
  WHERE rating_avg >= 4.5 AND badge IS NULL
  ORDER BY rating_avg DESC
  LIMIT 3
);

UPDATE courses 
SET badge = 'new' 
WHERE id IN (
  SELECT id FROM courses 
  WHERE created_at >= NOW() - INTERVAL '30 days' AND badge IS NULL
  ORDER BY created_at DESC
  LIMIT 4
);

UPDATE courses 
SET badge = 'discount' 
WHERE id IN (
  SELECT id FROM courses 
  WHERE discount_price IS NOT NULL AND discount_price < price AND badge IS NULL
  ORDER BY (price - discount_price) DESC
  LIMIT 3
);

UPDATE courses 
SET badge = 'bestseller' 
WHERE id IN (
  SELECT id FROM courses 
  WHERE enrollment_count >= 100 AND badge IS NULL
  ORDER BY enrollment_count DESC
  LIMIT 3
);
