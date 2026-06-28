\c placement_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS placement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE NOT NULL,
  cgpa DECIMAL(3,2) DEFAULT 0,
  backlog_count INT DEFAULT 0,
  skill_tags TEXT[] DEFAULT '{}',
  resume_url VARCHAR(500),
  is_eligible BOOLEAN DEFAULT false,
  placement_status VARCHAR(20) DEFAULT 'not_placed' CHECK (
    placement_status IN ('not_placed','placed','opted_out')
  ),
  readiness_score DECIMAL(5,2),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  ctc_min DECIMAL(10,2),
  ctc_max DECIMAL(10,2),
  role VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recruitment_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  min_cgpa DECIMAL(3,2),
  max_backlogs INT DEFAULT 0,
  graduation_year INT,
  interview_date DATE,
  venue VARCHAR(255),
  drive_status VARCHAR(20) DEFAULT 'active' CHECK (
    drive_status IN ('active','completed','cancelled')
  ),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interview_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES recruitment_drives(id),
  student_id UUID NOT NULL,
  interview_date DATE,
  interview_time TIME,
  venue VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (
    status IN ('scheduled','completed','cancelled')
  ),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_placement_profiles_student ON placement_profiles(student_id);
CREATE INDEX idx_companies_institution ON companies(institution_id);
CREATE INDEX idx_interviews_student ON interview_schedules(student_id);
CREATE INDEX idx_interviews_drive ON interview_schedules(drive_id);
