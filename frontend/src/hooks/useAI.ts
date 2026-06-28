import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../app/api';

export function useEligibilityRisk() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/ai/eligibility-risk', data).then(r => r.data),
  });
}

export function useStudentRecommendations(studentId: string, payload: Record<string, unknown>) {
  return useQuery({
    queryKey: ['recommendations', studentId],
    queryFn: () => api.post(`/ai/recommendations/${studentId}`, payload).then(r => r.data.data ?? r.data),
    enabled: !!studentId && Object.keys(payload).length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDropoutRisk() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/ai/dropout-risk', data).then(r => r.data),
  });
}

export function usePlacementReadiness(studentId: string) {
  return useQuery({
    queryKey: ['readiness', studentId],
    queryFn: () => api.post('/ai/placement/readiness-score', { student_id: studentId }).then(r => r.data.data),
    enabled: !!studentId,
  });
}

export function useSkillGap() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/ai/placement/skill-gap', data).then(r => r.data.data),
  });
}
