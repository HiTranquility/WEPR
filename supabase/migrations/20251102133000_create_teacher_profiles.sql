-- Teacher profile & settings data
CREATE TABLE IF NOT EXISTS teacher_profiles (
  teacher_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bank_name text,
  account_number text,
  account_name text,
  email_notifications boolean DEFAULT true,
  course_reviews boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_teacher_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teacher_profiles_updated_at ON teacher_profiles;
CREATE TRIGGER trg_teacher_profiles_updated_at
BEFORE UPDATE ON teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION set_teacher_profiles_updated_at();

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own profile settings"
ON teacher_profiles
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

