import api from '../../app/api';
import type { LoginRequest, LoginResponse, ApiResponse } from '../../types';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data).then(r => r.data.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }).then(r => r.data.data),

  register: (data: { email: string; password: string; role: string; institutionId?: string }) =>
    api.post('/auth/register', data).then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }).then(r => r.data),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`).then(r => r.data),

  getAuditLogs: (page = 1, limit = 50) =>
    api.get(`/auth/audit-logs?page=${page}&limit=${limit}`).then(r => r.data),
};
