import api from '../../app/api';
import type {
  EligibilityRiskResult, PerformancePrediction, DropoutRiskResult,
  ForecastResult, RecommendationResult, PlacementReadiness, SkillGapResult,
} from '../../types';

export const aiService = {
  predictEligibilityRisk: (data: {
    student_id: string; attendance_percentage: number; fee_status: string;
    avg_internal_marks: number; prev_semester_gpa: number;
  }) => api.post<{ success: boolean; data: EligibilityRiskResult }>('/ai/eligibility-risk', data).then(r => r.data),

  predictEligibilityBatch: (students: unknown[]) =>
    api.post('/ai/eligibility-risk/batch', { students }).then(r => r.data),

  predictPerformance: (data: {
    student_id: string; internal_marks: number[]; attendance_percentage: number;
    prev_semester_gpa: number; backlog_count: number;
  }) => api.post<{ data: PerformancePrediction }>('/ai/performance-predict', data).then(r => r.data.data),

  predictDropout: (data: {
    student_id: string; attendance_trend: number[]; performance_trend: number[];
    fee_paid_ratio: number; current_gpa: number;
  }) => api.post<{ data: DropoutRiskResult }>('/ai/dropout-risk', data).then(r => r.data.data),

  forecastAttendance: (data: {
    department_id: string; subject_id: string; weekly_attendance: number[];
  }) => api.post<{ data: ForecastResult }>('/ai/attendance-forecast', data).then(r => r.data.data),

  getRecommendations: (studentId: string, payload: Record<string, unknown>) =>
    api.post<{ data: RecommendationResult }>(`/ai/recommendations/${studentId}`, payload).then(r => r.data.data ?? r.data),

  getPlacementReadiness: (data: {
    student_id: string; cgpa: number; backlog_count: number;
    skill_count: number; mock_interview_score?: number;
  }) => api.post<{ data: PlacementReadiness }>('/ai/placement/readiness-score', data).then(r => r.data.data),

  getSkillGap: (data: {
    student_id: string; student_skills: string[]; required_skills: string[];
  }) => api.post<{ data: SkillGapResult }>('/ai/placement/skill-gap', data).then(r => r.data.data),

  getModelVersions: () =>
    api.get('/ai/models/versions').then(r => r.data),
};
