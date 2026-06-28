\c exam_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID,
  subject_code VARCHAR(50) NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME,
  venue VARCHAR(255),
  duration_minutes INT,
  semester INT,
  academic_year VARCHAR(20),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  semester INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  internal_marks DECIMAL(5,2),
  semester_marks DECIMAL(5,2),
  total_marks DECIMAL(5,2),
  grade VARCHAR(5),
  gpa_points DECIMAL(4,2),
  is_backlog BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subject_code, semester, academic_year)
);

CREATE TABLE IF NOT EXISTS marks_bounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID,
  subject_code VARCHAR(50),
  internal_max DECIMAL(5,2) NOT NULL,
  semester_max DECIMAL(5,2) NOT NULL,
  pass_marks DECIMAL(5,2) NOT NULL,
  UNIQUE(institution_id, subject_code)
);

CREATE TABLE IF NOT EXISTS eligibility_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID UNIQUE,
  attendance_threshold DECIMAL(5,2) DEFAULT 75.0,
  fee_required BOOLEAN DEFAULT true,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hall_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  exam_cycle VARCHAR(50),
  generated_at TIMESTAMPTZ DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  block_reasons JSONB,
  override_by UUID,
  override_reason VARCHAR(500),
  pdf_url VARCHAR(500)
);

CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_subject ON marks(subject_code, semester);
CREATE INDEX idx_hall_tickets_student ON hall_tickets(student_id);
CREATE INDEX idx_exam_schedules_date ON exam_schedules(exam_date);
