import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feeService } from '../features/fees/feeService';

export function useFeeStatus(studentId: string) {
  return useQuery({
    queryKey: ['fee-status', studentId],
    queryFn: () => feeService.getStatus(studentId),
    enabled: !!studentId,
  });
}

export function useFeeDefaulters(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['fee-defaulters', page, limit],
    queryFn: () => feeService.getDefaulters(page, limit),
  });
}

export function useFeeAnalytics() {
  return useQuery({
    queryKey: ['fee-analytics'],
    queryFn: () => feeService.getAnalytics(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof feeService.recordTransaction>[0]) =>
      feeService.recordTransaction(data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['fee-status', vars.studentId] });
      qc.invalidateQueries({ queryKey: ['fee-defaulters'] });
      qc.invalidateQueries({ queryKey: ['fee-analytics'] });
    },
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof feeService.createStructure>[0]) =>
      feeService.createStructure(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-analytics'] }),
  });
}
