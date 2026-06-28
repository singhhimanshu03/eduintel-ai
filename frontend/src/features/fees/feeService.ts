import api from '../../app/api';
import type { FeeStructure, FeeTransaction, StudentFeeLedger, ApiResponse } from '../../types';

export const feeService = {
  createStructure: (data: Partial<FeeStructure>) =>
    api.post<ApiResponse<FeeStructure>>('/fees/structures', data).then(r => r.data.data),

  getStatus: (studentId: string) =>
    api.get<ApiResponse<StudentFeeLedger>>(`/fees/students/${studentId}/status`).then(r => r.data.data),

  recordTransaction: (data: {
    studentId: string; amount: number; paymentMode: string;
    receiptNumber: string; paymentStatus?: string;
  }) => api.post('/fees/transactions', data).then(r => r.data),

  getDefaulters: (page = 1, limit = 50) =>
    api.get<ApiResponse<StudentFeeLedger[]>>(`/fees/defaulters?page=${page}&limit=${limit}`).then(r => r.data.data),

  getAnalytics: () =>
    api.get('/fees/analytics').then(r => r.data.data),
};
