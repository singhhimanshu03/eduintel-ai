import api from '../../app/api';
import type { Faculty, SubjectAssignment, ApiResponse } from '../../types';

export const facultyService = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Faculty[]>>('/faculty', { params }).then(r => r.data.data),

  get: (id: string) =>
    api.get<ApiResponse<Faculty>>(`/faculty/${id}`).then(r => r.data.data),

  create: (data: Partial<Faculty> & { facultyCode: string; fullName: string; email: string; institutionId: string }) =>
    api.post<ApiResponse<{ id: string; faculty_code: string }>>('/faculty', data).then(r => r.data.data),

  update: (id: string, data: Partial<Faculty>) =>
    api.put<ApiResponse<Faculty>>(`/faculty/${id}`, data).then(r => r.data.data),

  getSubjects: (id: string) =>
    api.get<ApiResponse<SubjectAssignment[]>>(`/faculty/${id}/subjects`).then(r => r.data.data),

  assignSubject: (
    id: string,
    data: { subjectCode: string; subjectName: string; courseId?: string; semester?: number }
  ) =>
    api.post<ApiResponse<SubjectAssignment>>(`/faculty/${id}/subjects`, data).then(r => r.data.data),
};
