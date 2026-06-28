import api from '../../app/api';
import type { Notification, ApiResponse } from '../../types';

export const notificationService = {
  getForUser: (userId: string, page = 1, limit = 30) =>
    api
      .get<ApiResponse<Notification[]>>(`/notifications/user/${userId}?page=${page}&limit=${limit}`)
      .then(r => r.data.data),

  markRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`).then(r => r.data),

  savePreferences: (prefs: {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    eventOverrides?: Record<string, boolean>;
  }) => api.post('/notifications/preferences', prefs).then(r => r.data),
};
