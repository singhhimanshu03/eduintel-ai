import api from '../../app/api';
import type { Student, AcademicHistory, StudentDocument, ApiResponse } from '../../types';

export const studentService = {
  list: (params?: Record<string, string>) =>
    api.get<ApiResponse<Student[]>>('/students', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Student>>(`/students/${id}`).then(r => r.data.data),

  create: (data: Partial<Student> & { institutionId: string }) =>
    api.post<ApiResponse<{ id: string; student_code: string }>>('/students', data).then(r => r.data.data),

  update: (id: string, data: Partial<Student>) =>
    api.put<ApiResponse<Student>>(`/students/${id}`, data).then(r => r.data.data),

  deactivate: (id: string) =>
    api.delete(`/students/${id}`).then(r => r.data),

  getAcademicHistory: (id: string) =>
    api.get<ApiResponse<AcademicHistory[]>>(`/students/${id}/academic-history`).then(r => r.data.data),

  getDocuments: (id: string) =>
    api.get<ApiResponse<StudentDocument[]>>(`/students/${id}/documents`).then(r => r.data.data),

  uploadDocument: (id: string, file: File, documentType: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    return api.post(`/students/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  bulkImport: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/students/bulk-import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};
