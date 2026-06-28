import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { markAllRead } from '../../features/notifications/notificationSlice';
import { useNotifications, useMarkNotificationRead } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import type { Notification } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EVENT_ICONS: Record<string, string> = {
  fee_reminder: '💰', attendance_warning: '📋', result_published: '📚',
  placement_update: '🎓', dropout_risk_alert: '⚠️', subject_assigned: '📝',
  custom: '✉️', default: '🔔',
};

const STATUS: Record<string, { label: string; cls: string }> = {
  delivered: { label: 'Read',   cls: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400' },
  pending:   { label: 'Unread', cls: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
  failed:    { label: 'Failed', cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
};

export default function MyNotifications() {
  const { userId } = useAuth();
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((s: RootState) => s.notifications);
  const { isLoading } = useNotifications(userId ?? '');
  const markReadMutation = useMarkNotificationRead();

  if (isLoading) return <LoadingSpinner message="Loading notifications…" />;

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="My Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={unreadCount > 0 ? (
          <button onClick={() => dispatch(markAllRead())}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Mark all as read
          </button>
        ) : undefined}
      />

      {items.length === 0 ? (
        <div className="card py-16 text-center transition-colors duration-200">
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-white/5 overflow-hidden transition-colors duration-200">
          {items.map(n => {
            const status  = STATUS[n.delivery_status] ?? STATUS.pending;
            const isUnread = n.delivery_status !== 'delivered';
            return (
              <button key={n.id}
                onClick={() => isUnread && markReadMutation.mutate(n.id)}
                className={`w-full text-left px-5 py-4 flex gap-4 items-start transition-colors
                  hover:bg-gray-50 dark:hover:bg-white/5
                  ${isUnread ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {EVENT_ICONS[n.event_type] ?? EVENT_ICONS.default}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    {n.subject && (
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{n.subject}</p>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </p>
                </div>
                {isUnread && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
