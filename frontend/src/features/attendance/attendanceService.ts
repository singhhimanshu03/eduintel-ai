import api from '../../app/api';
import type { ClassSession, AttendanceSummary, ApiResponse } from '../../types';

export const attendanceService = {
  createSession: (data: Partial<ClassSession>) =>
    api.post<ApiResponse<{ classSessionId: string }>>('/attendance/classes', data).then(r => r.data.data),

  markAttendance: (sessionId: string, records: { studentId: string; status: string }[]) =>
    api.post(`/attendance/classes/${sessionId}/mark`, { records }).then(r => r.data),

  editAttendance: (sessionId: string, updates: { recordId: string; newStatus: string; reason: string }[]) =>
    api.put(`/attendance/classes/${sessionId}/edit`, { updates }).then(r => r.data),

  getStudentAttendance: (studentId: string) =>
    api.get<ApiResponse<AttendanceSummary[]>>(`/attendance/students/${studentId}`).then(r => r.data.data),

  downloadPDF: (studentId: string) =>
    window.open(`/api/attendance/students/${studentId}/pdf`, '_blank'),

  getAnalytics: (params?: { dept?: string; semester?: string }) =>
    api.get('/attendance/analytics', { params }).then(r => r.data.data),
};
