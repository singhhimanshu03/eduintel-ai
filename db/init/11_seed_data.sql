-- ─────────────────────────────────────────────────────────────────────────────
-- EduIntel AI — Development Seed Data
-- Run ONLY in development / demo environments.
-- All column names verified against their schema files (02–09).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── auth_db ────────────────────────────────────────────────────────────────────
-- Schema columns: id, email, password_hash, role, institution_id,
--                 is_verified, is_locked, lock_until, failed_attempts
-- NOTE: password hashes below are PLACEHOLDERS — register via the app to get real hashes.
\c auth_db;

INSERT INTO users (id, email, password_hash, role, institution_id, is_verified, is_locked)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@eduintel.edu',     '$2a$12$LWT43kAHkjZjt8Za2S60FODhy9VBxe.1Azxw5GO7GfxPBdDjpMJ2W', 'college_admin',    '10000000-0000-0000-0000-000000000001', true, false),
  ('00000000-0000-0000-0000-000000000002', 'faculty1@eduintel.edu',  '$2a$12$LWT43kAHkjZjt8Za2S60FODhy9VBxe.1Azxw5GO7GfxPBdDjpMJ2W', 'faculty',          '10000000-0000-0000-0000-000000000001', true, false),
  ('00000000-0000-0000-0000-000000000003', 'student1@eduintel.edu',  '$2a$12$LWT43kAHkjZjt8Za2S60FODhy9VBxe.1Azxw5GO7GfxPBdDjpMJ2W', 'student',          '10000000-0000-0000-0000-000000000001', true, false),
  ('00000000-0000-0000-0000-000000000004', 'parent1@eduintel.edu',   '$2a$12$LWT43kAHkjZjt8Za2S60FODhy9VBxe.1Azxw5GO7GfxPBdDjpMJ2W', 'parent',           '10000000-0000-0000-0000-000000000001', true, false),
  ('00000000-0000-0000-0000-000000000005', 'exam@eduintel.edu',      '$2a$12$LWT43kAHkjZjt8Za2S60FODhy9VBxe.1Azxw5GO7GfxPBdDjpMJ2W', 'examination_cell', '10000000-0000-0000-0000-000000000001', true, false),
  ('00000000-0000-0000-0000-000000000006', 'placement@eduintel.edu', '$2a$12$LWT43kAHkjZjt8Za2S60FODhy9VBxe.1Azxw5GO7GfxPBdDjpMJ2W', 'placement_cell',   '10000000-0000-0000-0000-000000000001', true, false),
  ('00000000-0000-0000-0000-000000000007', 'superadmin@eduintel.edu','$2a$12$LWT43kAHkjZjt8Za2S60FODhy9VBxe.1Azxw5GO7GfxPBdDjpMJ2W', 'super_admin',      NULL,                                   true, false)
ON CONFLICT (email) DO NOTHING;


-- ── student_db ─────────────────────────────────────────────────────────────────
-- Student IDs MUST match the auth user IDs so the student service
-- can look up data by the JWT userId claim.
\c student_db;

INSERT INTO students (id, institution_id, student_code, full_name, email, phone, gender, current_semester, enrollment_status)
VALUES
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'CS2024001', 'Arjun Mehta',  'arjun@student.edu',  '9876543210', 'male',   5, 'active'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'CS2024002', 'Priya Sharma', 'priya@student.edu',  '9876543211', 'female', 5, 'active'),
  ('a0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'CS2024003', 'Rahul Gupta',  'rahul@student.edu',  '9876543212', 'male',   3, 'active'),
  ('a0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'CS2024004', 'Sneha Patel',  'sneha@student.edu',  '9876543213', 'female', 3, 'active'),
  ('a0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'CS2024005', 'Vikram Singh', 'vikram@student.edu', '9876543214', 'male',   7, 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO academic_history (student_id, semester, academic_year, subject_code, subject_name, internal_marks, semester_marks, total_marks, grade, gpa, is_backlog)
VALUES
  ('00000000-0000-0000-0000-000000000003', 1, '2022-23', 'CS101', 'Programming Fundamentals', 38, 55, 93, 'O',  10, false),
  ('00000000-0000-0000-0000-000000000003', 1, '2022-23', 'MA101', 'Engineering Mathematics',  32, 48, 80, 'A+',  9, false),
  ('00000000-0000-0000-0000-000000000003', 2, '2022-23', 'CS201', 'Data Structures',          35, 52, 87, 'A+',  9, false),
  ('00000000-0000-0000-0000-000000000004', 1, '2022-23', 'CS101', 'Programming Fundamentals', 28, 40, 68, 'B+',  7, false),
  ('00000000-0000-0000-0000-000000000004', 2, '2022-23', 'CS201', 'Data Structures',          18, 22, 40, 'F',   0, true),
  ('a0000000-0000-0000-0000-000000000003', 1, '2023-24', 'CS101', 'Programming Fundamentals', 40, 58, 98, 'O',  10, false),
  ('a0000000-0000-0000-0000-000000000005', 3, '2023-24', 'CS301', 'Operating Systems',        30, 45, 75, 'A',   8, false),
  ('a0000000-0000-0000-0000-000000000005', 4, '2023-24', 'CS401', 'Database Management',      32, 50, 82, 'A+',  9, false)
ON CONFLICT DO NOTHING;


-- ── faculty_db ─────────────────────────────────────────────────────────────────
-- Schema columns: id, institution_id, faculty_code, full_name, department_id,
--                 designation, email, phone, employment_status
\c faculty_db;

INSERT INTO faculty (id, institution_id, faculty_code, full_name, email, designation, employment_status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'FAC001', 'Dr. Ramesh Kumar', 'ramesh@faculty.edu', 'Professor',           'active'),
  ('b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'FAC002', 'Ms. Anita Desai',  'anita@faculty.edu',  'Associate Professor', 'active'),
  ('b0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'FAC003', 'Mr. Suresh Patel', 'suresh@faculty.edu', 'Assistant Professor', 'active')
ON CONFLICT (email) DO NOTHING;

-- Schema columns: faculty_id, subject_code, subject_name, course_id, semester, effective_from, is_active
INSERT INTO faculty_subject_assignments (faculty_id, subject_code, subject_name, semester, effective_from, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'CS301', 'Operating Systems',        3, CURRENT_DATE, true),
  ('b0000000-0000-0000-0000-000000000001', 'CS401', 'Database Management',      4, CURRENT_DATE, true),
  ('b0000000-0000-0000-0000-000000000002', 'CS201', 'Data Structures',          2, CURRENT_DATE, true),
  ('b0000000-0000-0000-0000-000000000003', 'CS101', 'Programming Fundamentals', 1, CURRENT_DATE, true)
ON CONFLICT DO NOTHING;


-- ── attendance_db ──────────────────────────────────────────────────────────────
-- Table name is "attendance_summary" (not "attendance_summaries")
-- Schema columns for attendance_summary: student_id, subject_code, semester,
--   total_classes, attended_classes, attendance_percentage, last_updated
\c attendance_db;

INSERT INTO class_sessions (id, faculty_id, subject_code, semester, session_date, time_slot, institution_id)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CS301', 3, CURRENT_DATE - 5, '09:00-10:00', '10000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'CS301', 3, CURRENT_DATE - 4, '09:00-10:00', '10000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'CS301', 3, CURRENT_DATE - 3, '09:00-10:00', '10000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO attendance_records (class_session_id, student_id, status, marked_by)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'present', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'absent',  'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'present', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'present', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'absent',  'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'present', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'present', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Table is "attendance_summary" (singular) per schema
INSERT INTO attendance_summary (student_id, subject_code, semester, total_classes, attended_classes, attendance_percentage)
VALUES
  -- original rows (a0000000... students)
  ('a0000000-0000-0000-0000-000000000001', 'CS301', 3,  3,  3, 100.0),
  ('a0000000-0000-0000-0000-000000000002', 'CS301', 3,  3,  1,  33.3),
  ('a0000000-0000-0000-0000-000000000003', 'CS301', 3,  1,  1, 100.0),
  -- ── ADDED: attendance for auth student users (000...003 = Arjun, 000...004 = Priya) ──
  -- These IDs match auth_db.users AND student_db.students so the student dashboard
  -- can look up data by JWT userId (00000000-0000-0000-0000-000000000003)
  ('00000000-0000-0000-0000-000000000003', 'CS101', 1, 40, 38,  95.0),
  ('00000000-0000-0000-0000-000000000003', 'MA101', 1, 38, 33,  86.8),
  ('00000000-0000-0000-0000-000000000003', 'CS201', 2, 42, 39,  92.9),
  ('00000000-0000-0000-0000-000000000003', 'CS301', 3, 45, 42,  93.3),
  ('00000000-0000-0000-0000-000000000003', 'CS401', 4, 40, 36,  90.0),
  ('00000000-0000-0000-0000-000000000004', 'CS101', 1, 40, 28,  70.0),
  ('00000000-0000-0000-0000-000000000004', 'MA101', 1, 38, 22,  57.9),
  ('00000000-0000-0000-0000-000000000004', 'CS201', 2, 42, 25,  59.5),
  ('00000000-0000-0000-0000-000000000004', 'CS301', 3, 45, 26,  57.8)
ON CONFLICT (student_id, subject_code, semester) DO UPDATE SET
  total_classes         = EXCLUDED.total_classes,
  attended_classes      = EXCLUDED.attended_classes,
  attendance_percentage = EXCLUDED.attendance_percentage,
  last_updated          = now();


-- ── fee_db ─────────────────────────────────────────────────────────────────────
\c fee_db;

INSERT INTO fee_structures (institution_id, course_id, semester, academic_year, total_amount, due_date)
VALUES
  ('10000000-0000-0000-0000-000000000001', NULL, 5, '2024-25', 45000.00, CURRENT_DATE + 30),
  ('10000000-0000-0000-0000-000000000001', NULL, 3, '2024-25', 40000.00, CURRENT_DATE + 30)
ON CONFLICT DO NOTHING;

INSERT INTO student_fee_ledger (student_id, total_fee, paid_amount, balance, fee_status, last_payment_date)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 45000.00, 45000.00,     0.00, 'paid',           now() - INTERVAL '30 days'),
  ('a0000000-0000-0000-0000-000000000002', 40000.00, 20000.00, 20000.00, 'partially_paid', now() - INTERVAL '60 days'),
  ('a0000000-0000-0000-0000-000000000003', 40000.00,     0.00, 40000.00, 'unpaid',         NULL),
  ('a0000000-0000-0000-0000-000000000004', 40000.00, 40000.00,     0.00, 'paid',           now() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000005', 45000.00, 45000.00,     0.00, 'paid',           now() - INTERVAL '5 days'),
  -- ── ADDED: ledger rows for JWT student users so fee lookups return real status ──
  ('00000000-0000-0000-0000-000000000003', 45000.00, 45000.00,     0.00, 'paid',           now() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000004', 45000.00, 22500.00, 22500.00, 'partially_paid', now() - INTERVAL '14 days')
ON CONFLICT (student_id) DO NOTHING;

-- ── fee_transactions: real payment history so dailyCollection chart has data ──
INSERT INTO fee_transactions (student_id, institution_id, amount, payment_mode, receipt_number, payment_status, transaction_date)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 45000.00, 'online', 'RCP-2024-001', 'completed', now() - INTERVAL '30 days'),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 20000.00, 'online', 'RCP-2024-002', 'completed', now() - INTERVAL '25 days'),
  ('a0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 40000.00, 'cash',   'RCP-2024-003', 'completed', now() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 45000.00, 'online', 'RCP-2024-004', 'completed', now() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 45000.00, 'online', 'RCP-2024-005', 'completed', now() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 22500.00, 'dd',     'RCP-2024-006', 'completed', now() - INTERVAL '14 days')
ON CONFLICT (receipt_number, institution_id) DO NOTHING;

-- ── exam_db ─────────────────────────────────────────────────────────────────────
-- The examination service reads from exam_db.marks (NOT student_db.academic_history).
-- published=true is required — GET /api/exams/results/:id filters WHERE published=true.
\c exam_db;

INSERT INTO marks (student_id, subject_code, semester, academic_year, internal_marks, semester_marks, total_marks, grade, gpa_points, is_backlog, published)
VALUES
  -- Arjun Mehta (000...003) — Sems 1–4
  ('00000000-0000-0000-0000-000000000003', 'CS101', 1, '2022-23', 38, 55, 93, 'O',  10.0, false, true),
  ('00000000-0000-0000-0000-000000000003', 'MA101', 1, '2022-23', 32, 48, 80, 'A+',  9.0, false, true),
  ('00000000-0000-0000-0000-000000000003', 'CS201', 2, '2022-23', 35, 52, 87, 'A+',  9.0, false, true),
  ('00000000-0000-0000-0000-000000000003', 'CS202', 2, '2022-23', 30, 46, 76, 'A',   8.0, false, true),
  ('00000000-0000-0000-0000-000000000003', 'CS301', 3, '2023-24', 36, 54, 90, 'O',  10.0, false, true),
  ('00000000-0000-0000-0000-000000000003', 'CS302', 3, '2023-24', 33, 50, 83, 'A+',  9.0, false, true),
  ('00000000-0000-0000-0000-000000000003', 'CS401', 4, '2023-24', 34, 51, 85, 'A+',  9.0, false, true),
  ('00000000-0000-0000-0000-000000000003', 'CS402', 4, '2023-24', 29, 44, 73, 'A',   8.0, false, true),
  -- Priya Sharma (000...004) — Sems 1–2 (one backlog in Sem 2)
  ('00000000-0000-0000-0000-000000000004', 'CS101', 1, '2022-23', 28, 40, 68, 'B+',  7.0, false, true),
  ('00000000-0000-0000-0000-000000000004', 'MA101', 1, '2022-23', 22, 30, 52, 'B',   6.0, false, true),
  ('00000000-0000-0000-0000-000000000004', 'CS201', 2, '2022-23', 18, 22, 40, 'F',   0.0, true,  true),
  ('00000000-0000-0000-0000-000000000004', 'CS202', 2, '2022-23', 25, 38, 63, 'B+',  7.0, false, true),
  -- a-students
  ('a0000000-0000-0000-0000-000000000003', 'CS101', 1, '2023-24', 40, 58, 98, 'O',  10.0, false, true),
  ('a0000000-0000-0000-0000-000000000005', 'CS301', 3, '2023-24', 30, 45, 75, 'A',   8.0, false, true),
  ('a0000000-0000-0000-0000-000000000005', 'CS401', 4, '2023-24', 32, 50, 82, 'A+',  9.0, false, true)
ON CONFLICT (student_id, subject_code, semester, academic_year) DO UPDATE SET
  published = true;

-- ── placement_db ───────────────────────────────────────────────────────────────
\c placement_db;

INSERT INTO companies (id, institution_id, company_name, industry, ctc_min, ctc_max, role, is_active)
VALUES
  ('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Infosys', 'IT Services',  4.5,  8.0, 'System Engineer',          true),
  ('d0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'TCS',     'IT Services',  3.5,  7.0, 'Assistant System Engineer', true),
  ('d0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Google',  'Product',     15.0, 40.0, 'Software Engineer L3',      true),
  ('d0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Wipro',   'IT Services',  3.5,  6.5, 'Project Engineer',          true),
  ('d0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Zoho',    'Product',      5.0, 12.0, 'Software Developer',        true)
ON CONFLICT DO NOTHING;

INSERT INTO placement_profiles (student_id, cgpa, backlog_count, skill_tags, is_eligible, placement_status, readiness_score)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 9.2, 0, ARRAY['Python','Java','SQL','React'],    true, 'not_placed', 82),
  ('a0000000-0000-0000-0000-000000000002', 6.8, 1, ARRAY['Python','SQL'],                   true, 'not_placed', 55),
  ('a0000000-0000-0000-0000-000000000003', 8.5, 0, ARRAY['C++','Java','Data Structures'],   true, 'not_placed', 74),
  ('a0000000-0000-0000-0000-000000000005', 8.9, 0, ARRAY['Python','ML','Pandas','FastAPI'], true, 'placed',     88)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO recruitment_drives (id, company_id, min_cgpa, max_backlogs, graduation_year, interview_date, venue, drive_status)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 6.0, 2, 2025, CURRENT_DATE + 14, 'Main Auditorium', 'active'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 8.0, 0, 2025, CURRENT_DATE + 30, 'Seminar Hall B',  'active')
ON CONFLICT DO NOTHING;


-- ── notification_db ────────────────────────────────────────────────────────────
-- Schema channel check: only 'email' | 'in_app' allowed (not 'both')
\c notification_db;

INSERT INTO notifications (user_id, event_type, channel, subject, message, delivery_status)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'attendance_warning', 'in_app',
   'Low Attendance Alert',
   'Your attendance in CS301 has dropped to 33.3%. Immediate improvement required to maintain exam eligibility.',
   'delivered'),
  ('00000000-0000-0000-0000-000000000003', 'fee_reminder', 'in_app',
   'Fee Payment Reminder',
   'Semester 3 fee of ₹40,000 is due in 30 days. Please pay promptly to avoid hall ticket blocking.',
   'pending')
ON CONFLICT DO NOTHING;
