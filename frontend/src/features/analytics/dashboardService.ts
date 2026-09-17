import api from '../../app/api';
import type { AdminDashboardData, FacultyDashboardData, StudentDashboardData } from '../../types';

export const dashboardService = {
  getAdmin: () =>
    api.get<{ success: boolean; data: AdminDashboardData }>('/analytics/dashboard/admin').then(r => r.data.data),

  getFaculty: () =>
    api.get<{ success: boolean; data: FacultyDashboardData }>('/analytics/dashboard/faculty').then(r => r.data.data),

  getStudent: (studentId: string) =>
    api.get<{ success: boolean; data: StudentDashboardData }>(`/analytics/dashboard/student/${studentId}`).then(r => r.data.data),

  getParent: (studentId: string) =>
    api.get(`/analytics/dashboard/parent/${studentId}`).then(r => r.data.data),

  exportReport: async (type: string, format: 'excel' | 'pdf') => {
    const resp = await api.get(`/analytics/reports/${type}/export`, {
      params: { format },
      responseType: 'blob',
    });
    const blob = new Blob([resp.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
