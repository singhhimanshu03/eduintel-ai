\c attendance_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  course_id UUID,
  semester INT,
  session_date DATE NOT NULL,
  time_slot VARCHAR(50),
  institution_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_session_id UUID NOT NULL REFERENCES class_sessions(id),
  student_id UUID NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('present','absent','excused')),
  marked_by UUID NOT NULL,
  marked_at TIMESTAMPTZ DEFAULT now(),
  edited BOOLEAN DEFAULT false,
  edit_reason VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS attendance_edit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id UUID NOT NULL REFERENCES attendance_records(id),
  original_status VARCHAR(10) NOT NULL,
  edited_by UUID NOT NULL,
  edited_at TIMESTAMPTZ DEFAULT now(),
  reason VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS attendance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  semester INT NOT NULL,
  total_classes INT DEFAULT 0,
  attended_classes INT DEFAULT 0,
  attendance_percentage DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subject_code, semester)
);

CREATE INDEX idx_class_sessions_faculty ON class_sessions(faculty_id);
CREATE INDEX idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX idx_attendance_records_session ON attendance_records(class_session_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_summary_student ON attendance_summary(student_id);
