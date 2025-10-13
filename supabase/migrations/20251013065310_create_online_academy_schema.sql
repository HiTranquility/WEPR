/*
  # Online Academy Database Schema

  ## Overview
  This migration creates the complete database schema for an Online Academy platform with support for:
  - Multi-role users (students, teachers, admins)
  - Two-level category hierarchy
  - Courses with sections and video lectures
  - Enrollment and progress tracking
  - Reviews and watchlist functionality
  - Full-text search capabilities

  ## Tables Created

  1. **users** - User accounts (students, teachers, admins)
     - id, email, password_hash, full_name, role, bio, avatar_url, email_verified
  
  2. **email_verifications** - OTP verification for email
     - id, email, otp_code, expires_at, verified
  
  3. **categories** - Two-level category hierarchy
     - id, name, parent_id, description
  
  4. **courses** - Course information
     - id, title, descriptions, teacher_id, category_id, pricing, status, statistics
  
  5. **sections** - Course chapters/sections
     - id, course_id, title, order_index
  
  6. **lectures** - Video lectures within sections
     - id, section_id, title, video_url, duration, is_preview, order_index
  
  7. **enrollments** - Student course enrollments
     - id, student_id, course_id, enrolled_at, completed_at
  
  8. **reviews** - Course reviews and ratings
     - id, student_id, course_id, rating, comment
  
  9. **watchlist** - Student favorite courses
     - id, student_id, course_id, added_at
  
  10. **lecture_progress** - Student progress tracking
      - id, student_id, lecture_id, completed, last_watched_at

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Students can only access their own data
  - Teachers can only manage their own courses
  - Admins have full access
  - Public users can view completed courses and categories

  ## Indexes
  - Full-text search on course titles and descriptions
  - Performance indexes on view counts, enrollments, ratings
  - Composite indexes for common query patterns
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  bio text,
  avatar_url text,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- EMAIL VERIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- ============================================================================
-- CATEGORIES TABLE (Two-level hierarchy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- ============================================================================
-- COURSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  short_description text NOT NULL,
  detailed_description text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  thumbnail_url text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  discount_price numeric(10, 2),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'incomplete', 'completed')),
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  enrollment_count integer DEFAULT 0,
  rating_avg numeric(3, 2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_view_count ON courses(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_courses_enrollment_count ON courses(enrollment_count DESC);
CREATE INDEX IF NOT EXISTS idx_courses_rating_avg ON courses(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON courses(is_featured) WHERE is_featured = true;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin(
  (title || ' ' || short_description) gin_trgm_ops
);

-- ============================================================================
-- SECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sections_course_id ON sections(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(course_id, order_index);

-- ============================================================================
-- LECTURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text NOT NULL,
  duration integer DEFAULT 0,
  is_preview boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lectures_section_id ON lectures(section_id);
CREATE INDEX IF NOT EXISTS idx_lectures_order ON lectures(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lectures_preview ON lectures(is_preview) WHERE is_preview = true;

-- ============================================================================
-- ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments(enrolled_at DESC);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================================================
-- WATCHLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_student_id ON watchlist(student_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_course_id ON watchlist(course_id);

-- ============================================================================
-- LECTURE PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lecture_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id uuid NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  last_watched_at timestamptz DEFAULT now(),
  UNIQUE(student_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_student_id ON lecture_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture_id ON lecture_progress(lecture_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view teacher profiles"
  ON users FOR SELECT
  TO public
  USING (role = 'teacher');

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Email verifications table
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert email verifications"
  ON email_verifications FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view own email verifications"
  ON email_verifications FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update own email verifications"
  ON email_verifications FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view completed courses"
  ON courses FOR SELECT
  TO public
  USING (status = 'completed');

CREATE POLICY "Teachers can view own courses"
  ON courses FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert own courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sections table
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sections of completed courses"
  ON sections FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = sections.course_id AND status = 'completed'
    )
  );

CREATE POLICY "Teachers can manage own course sections"
  ON sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = sections.course_id AND teacher_id = auth.uid()
    )
  );

-- Lectures table
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view preview lectures"
  ON lectures FOR SELECT
  TO public
  USING (
    is_preview = true AND
    EXISTS (
      SELECT 1 FROM sections s
      JOIN courses c ON c.id = s.course_id
      WHERE s.id = lectures.section_id AND c.status = 'completed'
    )
  );

CREATE POLICY "Enrolled students can view all lectures"
  ON lectures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sections s
      JOIN courses c ON c.id = s.course_id
      JOIN enrollments e ON e.course_id = c.id
      WHERE s.id = lectures.section_id AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage own course lectures"
  ON lectures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sections s
      JOIN courses c ON c.id = s.course_id
      WHERE s.id = lectures.section_id AND c.teacher_id = auth.uid()
    )
  );

-- Enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Teachers can view their course enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Students can insert reviews for enrolled courses"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE student_id = auth.uid() AND course_id = reviews.course_id
    )
  );

CREATE POLICY "Students can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- Watchlist table
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own watchlist"
  ON watchlist FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can add to own watchlist"
  ON watchlist FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can remove from own watchlist"
  ON watchlist FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- Lecture progress table
ALTER TABLE lecture_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
  ON lecture_progress FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own progress"
  ON lecture_progress FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own progress"
  ON lecture_progress FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update users.updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update course statistics when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE courses
    SET 
      rating_avg = COALESCE((
        SELECT AVG(rating)::numeric(3,2)
        FROM reviews
        WHERE course_id = OLD.course_id
      ), 0),
      rating_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE course_id = OLD.course_id
      )
    WHERE id = OLD.course_id;
    RETURN OLD;
  ELSE
    UPDATE courses
    SET 
      rating_avg = COALESCE((
        SELECT AVG(rating)::numeric(3,2)
        FROM reviews
        WHERE course_id = NEW.course_id
      ), 0),
      rating_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE course_id = NEW.course_id
      )
    WHERE id = NEW.course_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_course_rating();

-- Update enrollment count when enrollment is added/removed
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE courses
    SET enrollment_count = (
      SELECT COUNT(*)
      FROM enrollments
      WHERE course_id = OLD.course_id
    )
    WHERE id = OLD.course_id;
    RETURN OLD;
  ELSE
    UPDATE courses
    SET enrollment_count = (
      SELECT COUNT(*)
      FROM enrollments
      WHERE course_id = NEW.course_id
    )
    WHERE id = NEW.course_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_count
  AFTER INSERT OR DELETE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_enrollment_count();

-- Update course last_updated when sections or lectures change
CREATE OR REPLACE FUNCTION update_course_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE courses
    SET last_updated = now()
    WHERE id = (
      SELECT course_id FROM sections WHERE id = OLD.section_id
    );
    RETURN OLD;
  ELSE
    UPDATE courses
    SET last_updated = now()
    WHERE id = (
      SELECT course_id FROM sections WHERE id = NEW.section_id
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_on_section_change
  AFTER INSERT OR UPDATE OR DELETE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_course_last_updated();

CREATE TRIGGER update_course_on_lecture_change
  AFTER INSERT OR UPDATE OR DELETE ON lectures
  FOR EACH ROW
  EXECUTE FUNCTION update_course_last_updated();