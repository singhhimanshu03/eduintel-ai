// ─── API Response Wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole =
  | 'super_admin'
  | 'college_admin'
  | 'faculty'
  | 'student'
  | 'parent'
  | 'examination_cell'
  | 'placement_cell';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  institutionId?: string;
}

export interface LoginRequest  { email: string; password: string; }
export interface LoginResponse { accessToken: string; refreshToken: string; role: UserRole; }

// ─── Student ───────────────────────────────────────────────────────────────────
export type EnrollmentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';

export interface Student {
  id: string;
  institution_id: string;
  student_code: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  email: string;
  phone?: string;
  department_id?: string;
  course_id?: string;
  current_semester?: number;
  enrollment_date?: string;
  enrollment_status: EnrollmentStatus;
  profile_photo_url?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicHistory {
  id: string;
  student_id: string;
  semester: number;
  academic_year: string;
  subject_code: string;
  subject_name: string;
  internal_marks?: number;
  semester_marks?: number;
  total_marks?: number;
  grade?: string;
  gpa?: number;
  is_backlog: boolean;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  document_type: string;
  file_url: string;
  file_size_bytes?: number;
  uploaded_at: string;
}

// ─── Faculty ───────────────────────────────────────────────────────────────────
export type EmploymentStatus = 'active' | 'inactive';

export interface Faculty {
  id: string;
  institution_id: string;
  faculty_code: string;
  full_name: string;
  department_id?: string;
  designation?: string;
  email: string;
  phone?: string;
  employment_status: EmploymentStatus;
}

export interface SubjectAssignment {
  id: string;
  faculty_id: string;
  subject_code: string;
  subject_name: string;
  course_id?: string;
  semester?: number;
  effective_from?: string;
  is_active: boolean;
}

// ─── Attendance ────────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface ClassSession {
  id: string;
  faculty_id: string;
  subject_code: string;
  course_id?: string;
  semester?: number;
  session_date: string;
  time_slot?: string;
  institution_id: string;
}

export interface AttendanceRecord {
  id: string;
  class_session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_by: string;
  marked_at: string;
  edited: boolean;
}

export interface AttendanceSummary {
  id: string;
  student_id: string;
  subject_code: string;
  semester: number;
  total_classes: number;
  attended_classes: number;
  attendance_percentage: string;
  last_updated: string;
}

// ─── Examination ───────────────────────────────────────────────────────────────
export interface ExamSchedule {
  id: string;
  institution_id: string;
  subject_code: string;
  exam_date: string;
  start_time: string;
  venue: string;
  duration_minutes: number;
  semester: number;
  academic_year: string;
  is_published: boolean;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_code: string;
  semester: number;
  academic_year: string;
  internal_marks?: number;
  semester_marks?: number;
  total_marks?: number;
  grade?: string;
  gpa_points?: number;
  is_backlog: boolean;
  published: boolean;
}

export interface HallTicket {
  id: string;
  student_id: string;
  exam_cycle: string;
  generated_at: string;
  is_blocked: boolean;
  block_reasons?: string[];
  override_by?: string;
  override_reason?: string;
  pdf_url?: string;
}

export interface HallTicketResult {
  success: boolean;
  reasons?: string[];
  data?: { pdfUrl: string };
}

// ─── Fee ───────────────────────────────────────────────────────────────────────
export type FeeStatus = 'paid' | 'partially_paid' | 'unpaid';
export type PaymentMode = 'cash' | 'online' | 'dd' | 'cheque';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface FeeStructure {
  id: string;
  institution_id: string;
  course_id?: string;
  semester: number;
  academic_year: string;
  total_amount: number;
  due_date: string;
}

export interface FeeTransaction {
  id: string;
  student_id: string;
  institution_id: string;
  amount: number;
  payment_mode: PaymentMode;
  receipt_number: string;
  payment_status: PaymentStatus;
  transaction_date: string;
}

export interface StudentFeeLedger {
  id: string;
  student_id: string;
  total_fee: number;
  paid_amount: number;
  balance: number;
  fee_status: FeeStatus;
  last_payment_date?: string;
  updated_at: string;
}

// ─── Placement ─────────────────────────────────────────────────────────────────
export type PlacementStatus = 'not_placed' | 'placed' | 'opted_out';

export interface PlacementProfile {
  id: string;
  student_id: string;
  cgpa: number;
  backlog_count: number;
  skill_tags: string[];
  resume_url?: string;
  is_eligible: boolean;
  placement_status: PlacementStatus;
  readiness_score?: number;
  updated_at: string;
}

export interface Company {
  id: string;
  institution_id: string;
  company_name: string;
  industry?: string;
  ctc_min?: number;
  ctc_max?: number;
  role?: string;
  is_active: boolean;
  created_at: string;
}

export interface RecruitmentDrive {
  id: string;
  company_id: string;
  min_cgpa?: number;
  max_backlogs: number;
  graduation_year?: number;
  interview_date?: string;
  venue?: string;
  drive_status: 'active' | 'completed' | 'cancelled';
}

export interface InterviewSchedule {
  id: string;
  drive_id: string;
  student_id: string;
  interview_date?: string;
  interview_time?: string;
  venue?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// ─── Notifications ─────────────────────────────────────────────────────────────
export type NotificationChannel = 'email' | 'in_app';
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'delayed';

export interface Notification {
  id: string;
  user_id: string;
  event_type: string;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  delivery_status: DeliveryStatus;
  retry_count: number;
  sent_at?: string;
  created_at: string;
}

// ─── AI Predictions ────────────────────────────────────────────────────────────
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface EligibilityRiskResult {
  student_id: string;
  risk_score: RiskLevel;
  confidence: number;
  feature_importance: Record<string, number>;
  model_version?: string;
}

export interface PerformancePrediction {
  student_id: string;
  predicted_gpa_lower: number;
  predicted_gpa_upper: number;
  backlog_probability: Record<string, number>;
  flagged_subjects: string[];
  model_version?: string;
}

export interface DropoutRiskResult {
  student_id: string;
  dropout_probability: number;
  risk_score: RiskLevel;
  risk_factors: string[];
  model_version?: string;
}

export interface AttendanceForecast {
  week: number;
  predicted_attendance: number;
  lower_bound: number;
  upper_bound: number;
}

export interface ForecastResult {
  department_id: string;
  subject_id: string;
  forecast: AttendanceForecast[];
  below_threshold_alert: boolean;
}

export interface RecommendationResult {
  student_id: string;
  subjects_needing_attention: string[];
  attendance_targets: Record<string, { current_marks: number; target: number }>;
  improvement_plan: string[];
  overall_risk: RiskLevel;
}

export interface PlacementReadiness {
  student_id: string;
  readiness_score: number;
  level: string;
  breakdown: {
    gpa_contribution: number;
    skill_contribution: number;
    interview_contribution: number;
    backlog_penalty: number;
  };
}

export interface SkillGapResult {
  student_id: string;
  skill_coverage_pct: number;
  matched_skills: string[];
  missing_skills: string[];
  priority_missing: string[];
}

// ─── Dashboard DTOs ────────────────────────────────────────────────────────────
export interface AdminDashboardData {
  students: { total: number };
  attendance: { data: { averageAttendance: string; studentsBelowThreshold: AttendanceSummary[]; lowestSubjects: { subject_code: string; avg_att: string }[] } };
  fees: { data: { summary: { fee_status: FeeStatus; count: string; total_collected: string }[]; dailyCollection: { date: string; daily_collection: number }[] } };
  aiInsights: { data: { low: number; medium: number; high: number } };
}

export interface FacultyDashboardData {
  classAttendance: { data: { averageAttendance: string; studentsBelowThreshold: AttendanceSummary[] } };
  flaggedStudents: { data: { student_id: string; risk_score: RiskLevel; recommended_action?: string }[] };
}

export interface StudentDashboardData {
  attendance: { data: AttendanceSummary[] };
  results: { data: { marks: Mark[]; semesterGPA: Record<number, number>; backlogs: Mark[] } };
  recommendations: RecommendationResult;
}
