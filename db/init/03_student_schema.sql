\c student_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department_id UUID,
  course_id UUID,
  current_semester INT,
  enrollment_date DATE,
  enrollment_status VARCHAR(20) DEFAULT 'active' CHECK (
    enrollment_status IN ('active','inactive','graduated','dropped')
  ),
  profile_photo_url VARCHAR(500),
  parent_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  semester INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  internal_marks DECIMAL(5,2),
  semester_marks DECIMAL(5,2),
  total_marks DECIMAL(5,2),
  grade VARCHAR(5),
  gpa DECIMAL(4,2),
  is_backlog BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  document_type VARCHAR(100) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size_bytes INT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_dept ON students(department_id);
CREATE INDEX idx_academic_history_student ON academic_history(student_id);
CREATE INDEX idx_academic_history_semester ON academic_history(student_id, semester);
