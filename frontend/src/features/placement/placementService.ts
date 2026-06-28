import api from '../../app/api';
import type { PlacementProfile, Company, RecruitmentDrive, InterviewSchedule, ApiResponse } from '../../types';

export const placementService = {
  getProfile: (studentId: string) =>
    api.get<ApiResponse<PlacementProfile>>(`/placement/students/${studentId}/profile`).then(r => r.data.data),

  updateProfile: (studentId: string, data: Partial<PlacementProfile>) =>
    api.put(`/placement/students/${studentId}/profile`, data).then(r => r.data.data),

  getCompanies: () =>
    api.get<ApiResponse<Company[]>>('/placement/companies').then(r => r.data.data),

  createCompany: (data: Partial<Company>) =>
    api.post<ApiResponse<Company>>('/placement/companies', data).then(r => r.data.data),

  createDrive: (data: Partial<RecruitmentDrive>) =>
    api.post<ApiResponse<RecruitmentDrive>>('/placement/drives', data).then(r => r.data.data),

  getEligibleStudents: (driveId: string) =>
    api.get<ApiResponse<PlacementProfile[]>>(`/placement/drives/${driveId}/eligible-students`).then(r => r.data.data),

  scheduleInterview: (data: Partial<InterviewSchedule>) =>
    api.post<ApiResponse<InterviewSchedule>>('/placement/interviews', data).then(r => r.data.data),

  getAnalytics: () =>
    api.get('/placement/analytics').then(r => r.data.data),
};
