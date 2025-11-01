-- Ensure courses table has a description column for legacy triggers/search
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS description text;

UPDATE courses
SET description = COALESCE(detailed_description, short_description, '')
WHERE description IS NULL;

CREATE OR REPLACE FUNCTION sync_course_description()
RETURNS trigger AS $$
BEGIN
  NEW.description := COALESCE(NEW.detailed_description, NEW.short_description, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_courses_description_sync ON courses;
CREATE TRIGGER trg_courses_description_sync
BEFORE INSERT OR UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION sync_course_description();

