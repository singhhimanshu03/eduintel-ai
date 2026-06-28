import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../app/api';

export function useStudentAttendance(studentId: string) {
  return useQuery({
    queryKey: ['attendance', studentId],
    queryFn: () => api.get(`/attendance/students/${studentId}`).then(r => r.data.data),
    enabled: !!studentId,
  });
}

export function useAttendanceAnalytics(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['attendance-analytics', params],
    queryFn: () => api.get('/attendance/analytics', { params }).then(r => r.data.data),
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, records }: { sessionId: string; records: unknown[] }) =>
      api.post(`/attendance/classes/${sessionId}/mark`, { records }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useCreateClass() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/attendance/classes', data).then(r => r.data),
  });
}
