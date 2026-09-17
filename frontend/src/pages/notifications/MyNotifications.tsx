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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

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
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up ✓'}
        action={unreadCount > 0 ? (
          <button onClick={() => dispatch(markAllRead())} className="btn-ghost text-xs"
            style={{ color: 'var(--color-primary)' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark all as read
          </button>
        ) : undefined}
      />

      {items.length === 0 ? (
        <div className="card py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-elevated)' }}>🔔</div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No notifications yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>We'll notify you when something arrives.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {items.map((n, i) => {
            const isUnread = n.delivery_status !== 'delivered';
            const isFailed = n.delivery_status === 'failed';
            return (
              <button key={n.id}
                onClick={() => isUnread && markReadMutation.mutate(n.id)}
                className="w-full text-left px-5 py-4 flex gap-4 items-start transition-colors duration-100
                  hover:bg-[var(--color-elevated)]"
                style={{
                  backgroundColor: isUnread ? 'var(--color-primary-muted)' : 'transparent',
                  borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-elevated)' }}>
                  {EVENT_ICONS[n.event_type] ?? EVENT_ICONS.default}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    {n.subject && (
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-base)' }}>{n.subject}</p>
                    )}
                    <span className={`badge flex-shrink-0 text-[10px] ${
                      isFailed ? 'badge-danger' : isUnread ? 'badge-primary' : 'badge-neutral'
                    }`}>
                      {isFailed ? 'Failed' : isUnread ? 'Unread' : 'Read'}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{n.message}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    {n.created_at ? timeAgo(n.created_at) : ''}
                  </p>
                </div>
                {isUnread && (
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2 animate-pulse-dot"
                    style={{ backgroundColor: 'var(--color-primary)' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
