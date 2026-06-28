import api from '../../app/api';
import type { ExamSchedule, Mark, HallTicket, ApiResponse } from '../../types';

export const examService = {
  createSchedule: (data: Partial<ExamSchedule>) =>
    api.post<ApiResponse<ExamSchedule>>('/exams/schedules', data).then(r => r.data.data),

  getSchedules: () =>
    api.get<ApiResponse<ExamSchedule[]>>('/exams/schedules').then(r => r.data.data),

  submitMarks: (data: {
    studentId: string; subjectCode: string; semester: number;
    academicYear: string; internalMarks: number; semesterMarks: number;
  }) => api.post<ApiResponse<Mark>>('/exams/marks', data).then(r => r.data.data),

  publishResults: (semester: number, academicYear: string) =>
    api.post('/exams/results/publish', { semester, academicYear }).then(r => r.data),

  getResults: (studentId: string) =>
    api.get<ApiResponse<{ marks: Mark[]; semesterGPA: Record<number, number>; backlogs: Mark[] }>>(
      `/exams/results/${studentId}`
    ).then(r => r.data.data),

  generateHallTicket: (studentId: string, examCycle: string) =>
    api.post('/exams/hall-tickets/generate', { studentId, examCycle }).then(r => r.data),

  downloadHallTicket: (studentId: string) =>
    window.open(`/api/exams/hall-tickets/${studentId}/pdf`, '_blank'),

  overrideBlock: (hallTicketId: string, reason: string) =>
    api.post(`/exams/hall-tickets/${hallTicketId}/override`, { reason }).then(r => r.data),

  updateThreshold: (threshold: number) =>
    api.put('/exams/eligibility-threshold', { threshold }).then(r => r.data),
};
