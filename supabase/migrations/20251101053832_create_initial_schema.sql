/*
  # Create Initial Schema for Online Learning Platform

  1. New Tables
    - `users` - User accounts (admin, teacher, student)
    - `categories` - Course categories with parent-child relationships
    - `courses` - Course information with pricing, ratings, stats
    - `sections` - Course sections for organizing lectures
    - `lectures` - Individual video lectures
    - `enrollments` - Student course enrollments
    - `watchlist` - Student favorite courses
    - `reviews` - Course reviews and ratings

  2. Security
    - Enable RLS on all tables
    - Public read access for completed courses and categories
    - Role-based access control for teachers, students, admins
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  short_description text DEFAULT '',
  detailed_description text DEFAULT '',
  thumbnail_url text DEFAULT '',
  price numeric DEFAULT 0,
  discount_price numeric,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'disabled')),
  is_featured boolean DEFAULT false,
  rating_avg numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  enrollment_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  video_url text DEFAULT '',
  duration integer DEFAULT 0,
  is_preview boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(student_id, course_id)
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_sections_course_id ON sections(course_id);
CREATE INDEX IF NOT EXISTS idx_lectures_section_id ON lectures(section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_student_id ON watchlist(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Only admins can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Only admins can update categories" ON categories FOR UPDATE TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Only admins can delete categories" ON categories FOR DELETE TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Courses policies
CREATE POLICY "Anyone can view completed courses" ON courses FOR SELECT TO anon, authenticated USING (status = 'completed' OR teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Teachers can insert own courses" ON courses FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin') AND (teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'));
CREATE POLICY "Teachers can update own courses" ON courses FOR UPDATE TO authenticated USING (teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin') WITH CHECK (teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Teachers can delete own courses" ON courses FOR DELETE TO authenticated USING (teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Sections policies
CREATE POLICY "Anyone can view sections" ON sections FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = sections.course_id AND (courses.status = 'completed' OR courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));
CREATE POLICY "Teachers can insert sections" ON sections FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = sections.course_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));
CREATE POLICY "Teachers can update sections" ON sections FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = sections.course_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = sections.course_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));
CREATE POLICY "Teachers can delete sections" ON sections FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = sections.course_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));

-- Lectures policies
CREATE POLICY "Anyone can view lectures" ON lectures FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = lectures.section_id AND (courses.status = 'completed' OR courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));
CREATE POLICY "Teachers can insert lectures" ON lectures FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = lectures.section_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));
CREATE POLICY "Teachers can update lectures" ON lectures FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = lectures.section_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'))) WITH CHECK (EXISTS (SELECT 1 FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = lectures.section_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));
CREATE POLICY "Teachers can delete lectures" ON lectures FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = lectures.section_id AND (courses.teacher_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin')));

-- Enrollments policies
CREATE POLICY "Students can view own enrollments" ON enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin'));
CREATE POLICY "Students can enroll" ON enrollments FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'student' AND student_id = auth.uid());
CREATE POLICY "Students can update own enrollments" ON enrollments FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can delete enrollments" ON enrollments FOR DELETE TO authenticated USING (student_id = auth.uid());

-- Watchlist policies
CREATE POLICY "Students can view own watchlist" ON watchlist FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can add to watchlist" ON watchlist FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'student' AND student_id = auth.uid());
CREATE POLICY "Students can remove from watchlist" ON watchlist FOR DELETE TO authenticated USING (student_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Students can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'student' AND student_id = auth.uid());
CREATE POLICY "Students can update own reviews" ON reviews FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can delete own reviews" ON reviews FOR DELETE TO authenticated USING (student_id = auth.uid());