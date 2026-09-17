import api from '../../app/api';
import type { LoginRequest, LoginResponse, ApiResponse } from '../../types';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data).then(r => r.data.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }).then(r => r.data.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }).then(r => r.data),

  getAuditLogs: (page = 1, limit = 50) =>
    api.get(`/auth/audit-logs?page=${page}&limit=${limit}`).then(r => r.data),

  // ── Admin provisioning ────────────────────────────────────────────────────────
  createUser: (data: {
    email: string;
    fullName: string;
    role: string;
    institutionId: string;
    studentCode?: string;
    facultyCode?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    currentSemester?: number;
    departmentId?: string;
    courseId?: string;
    designation?: string;
    studentId?: string;
  }) => api.post<ApiResponse<{ userId: string }>>('/auth/admin/create-user', data).then(r => r.data),

  resendInvite: (userId: string) =>
    api.post(`/auth/admin/resend-invite/${userId}`).then(r => r.data),
};
