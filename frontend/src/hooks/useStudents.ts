import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../app/api';

export function useStudents(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => api.get('/students', { params }).then(r => r.data.data),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useStudentAcademicHistory(id: string) {
  return useQuery({
    queryKey: ['student-history', id],
    queryFn: () => api.get(`/students/${id}/academic-history`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/students', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/students/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student', id] }); qc.invalidateQueries({ queryKey: ['students'] }); },
  });
}
