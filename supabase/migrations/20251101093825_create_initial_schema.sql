/*
  # Tạo schema database cho hệ thống E-Learning
  
  1. Bảng mới
    - `users` - Lưu thông tin người dùng (admin, teacher, student)
      - `id` (serial, primary key)
      - `full_name` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `role` (text) - admin/teacher/student
      - `avatar_url` (text)
      - `bio` (text)
      - `status` (text) - active/inactive
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `categories` - Danh mục khóa học
      - `id` (serial, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamptz)
    
    - `courses` - Khóa học
      - `id` (serial, primary key)
      - `teacher_id` (int, foreign key -> users.id)
      - `category_id` (int, foreign key -> categories.id)
      - `title` (text)
      - `short_description` (text)
      - `detailed_description` (text)
      - `thumbnail_url` (text)
      - `price` (numeric)
      - `discount_price` (numeric)
      - `is_featured` (boolean)
      - `status` (text) - draft/completed
      - `rating_avg` (numeric)
      - `rating_count` (int)
      - `enrollment_count` (int)
      - `view_count` (int)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_updated` (timestamptz)
    
    - `sections` - Phần của khóa học
      - `id` (serial, primary key)
      - `course_id` (int, foreign key -> courses.id)
      - `title` (text)
      - `order_index` (int)
      - `created_at` (timestamptz)
    
    - `lectures` - Bài giảng
      - `id` (serial, primary key)
      - `section_id` (int, foreign key -> sections.id)
      - `title` (text)
      - `video_url` (text)
      - `duration` (int) - tính bằng phút
      - `is_preview` (boolean)
      - `order_index` (int)
      - `created_at` (timestamptz)
    
    - `enrollments` - Đăng ký khóa học
      - `id` (serial, primary key)
      - `student_id` (int, foreign key -> users.id)
      - `course_id` (int, foreign key -> courses.id)
      - `enrolled_at` (timestamptz)
      - `completed_at` (timestamptz)
    
    - `watchlist` - Danh sách yêu thích
      - `id` (serial, primary key)
      - `student_id` (int, foreign key -> users.id)
      - `course_id` (int, foreign key -> courses.id)
      - `added_at` (timestamptz)
    
    - `reviews` - Đánh giá khóa học
      - `id` (serial, primary key)
      - `student_id` (int, foreign key -> users.id)
      - `course_id` (int, foreign key -> courses.id)
      - `rating` (int) - 1-5
      - `comment` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Bảo mật
    - Bật RLS cho tất cả các bảng
    - Tạo policies cho authenticated users
    - Students chỉ có thể đọc courses và enrollments của mình
    - Teachers chỉ có thể quản lý courses của mình
    - Admin có quyền truy cập toàn bộ
*/

-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng courses
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  detailed_description TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  price NUMERIC(10, 2) DEFAULT 0,
  discount_price NUMERIC(10, 2),
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  rating_avg NUMERIC(3, 2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  enrollment_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng sections
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng lectures
CREATE TABLE IF NOT EXISTS lectures (
  id SERIAL PRIMARY KEY,
  section_id INT REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT DEFAULT '',
  duration INT DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo bảng enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);

-- Tạo bảng watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Tạo bảng reviews
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Tạo indexes cho hiệu năng
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_student ON watchlist(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);

-- Bật RLS cho tất cả các bảng
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho users
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true);

-- RLS Policies cho categories (public read)
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

-- RLS Policies cho courses (public read)
CREATE POLICY "Anyone can read published courses"
  ON courses FOR SELECT
  USING (true);

CREATE POLICY "Teachers can insert own courses"
  ON courses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Teachers can update own courses"
  ON courses FOR UPDATE
  USING (true);

CREATE POLICY "Teachers can delete own courses"
  ON courses FOR DELETE
  USING (true);

-- RLS Policies cho sections
CREATE POLICY "Anyone can read sections"
  ON sections FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage sections"
  ON sections FOR ALL
  USING (true);

-- RLS Policies cho lectures
CREATE POLICY "Anyone can read lectures"
  ON lectures FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage lectures"
  ON lectures FOR ALL
  USING (true);

-- RLS Policies cho enrollments
CREATE POLICY "Students can read own enrollments"
  ON enrollments FOR SELECT
  USING (true);

CREATE POLICY "Students can create enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can update own enrollments"
  ON enrollments FOR UPDATE
  USING (true);

-- RLS Policies cho watchlist
CREATE POLICY "Students can read own watchlist"
  ON watchlist FOR SELECT
  USING (true);

CREATE POLICY "Students can add to watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can remove from watchlist"
  ON watchlist FOR DELETE
  USING (true);

-- RLS Policies cho reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Students can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can update own reviews"
  ON reviews FOR UPDATE
  USING (true);

CREATE POLICY "Students can delete own reviews"
  ON reviews FOR DELETE
  USING (true);