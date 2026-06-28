import { useQuery } from '@tanstack/react-query';
import api from '../app/api';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: () => api.get('/analytics/dashboard/admin').then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useFacultyDashboard() {
  return useQuery({
    queryKey: ['dashboard-faculty'],
    queryFn: () => api.get('/analytics/dashboard/faculty').then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useStudentDashboard(studentId: string) {
  return useQuery({
    queryKey: ['dashboard-student', studentId],
    queryFn: () => api.get(`/analytics/dashboard/student/${studentId}`).then(r => r.data.data),
    enabled: !!studentId,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useParentDashboard(studentId: string) {
  return useQuery({
    queryKey: ['dashboard-parent', studentId],
    queryFn: () => api.get(`/analytics/dashboard/parent/${studentId}`).then(r => r.data.data),
    enabled: !!studentId,
  });
}
