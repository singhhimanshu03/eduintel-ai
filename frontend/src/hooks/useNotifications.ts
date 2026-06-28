import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { notificationService } from '../features/notifications/notificationService';
import { markRead, markAllRead, setNotifications } from '../features/notifications/notificationSlice';

export function useNotifications(userId: string) {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const data = await notificationService.getForUser(userId);
      dispatch(setNotifications(data ?? []));
      return data;
    },
    enabled: !!userId,
    refetchInterval: 60_000, // poll every 60s for new notifications
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: (_data, id) => {
      dispatch(markRead(id));
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead(userId: string) {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  // Mark all as read client-side (no bulk endpoint needed — just dispatch)
  return () => {
    dispatch(markAllRead());
    qc.invalidateQueries({ queryKey: ['notifications', userId] });
  };
}
