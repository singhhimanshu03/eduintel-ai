import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../features/faculty/facultyService';

export function useFacultyList(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['faculty', params],
    queryFn: () => facultyService.list(params),
  });
}

export function useFaculty(id: string) {
  return useQuery({
    queryKey: ['faculty-detail', id],
    queryFn: () => facultyService.get(id),
    enabled: !!id,
  });
}

export function useCreateFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof facultyService.create>[0]) => facultyService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faculty'] }),
  });
}

export function useUpdateFaculty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof facultyService.update>[1]) => facultyService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty-detail', id] });
      qc.invalidateQueries({ queryKey: ['faculty'] });
    },
  });
}

export function useFacultySubjects(id: string) {
  return useQuery({
    queryKey: ['faculty-subjects', id],
    queryFn: () => facultyService.getSubjects(id),
    enabled: !!id,
  });
}

export function useAssignSubject(facultyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof facultyService.assignSubject>[1]) =>
      facultyService.assignSubject(facultyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faculty-subjects', facultyId] }),
  });
}
