import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placementService } from '../features/placement/placementService';

export function usePlacementProfile(studentId: string) {
  return useQuery({
    queryKey: ['placement-profile', studentId],
    queryFn: () => placementService.getProfile(studentId),
    enabled: !!studentId,
  });
}

export function useUpdatePlacementProfile(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof placementService.updateProfile>[1]) =>
      placementService.updateProfile(studentId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['placement-profile', studentId] }),
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => placementService.getCompanies(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof placementService.createCompany>[0]) =>
      placementService.createCompany(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useCreateDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof placementService.createDrive>[0]) =>
      placementService.createDrive(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drives'] }),
  });
}

export function useEligibleStudentsForDrive(driveId: string) {
  return useQuery({
    queryKey: ['drive-eligible', driveId],
    queryFn: () => placementService.getEligibleStudents(driveId),
    enabled: !!driveId,
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof placementService.scheduleInterview>[0]) =>
      placementService.scheduleInterview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });
}

export function usePlacementAnalytics() {
  return useQuery({
    queryKey: ['placement-analytics'],
    queryFn: () => placementService.getAnalytics(),
    staleTime: 5 * 60 * 1000,
  });
}
