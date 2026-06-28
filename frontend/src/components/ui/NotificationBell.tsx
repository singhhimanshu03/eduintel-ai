import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../app/store';
import { togglePanel, closePanel } from '../../features/notifications/notificationSlice';
import { useNotifications, useMarkNotificationRead } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import type { Notification } from '../../types';

const EVENT_ICONS: Record<string, string> = {
  fee_reminder: '💰', attendance_warning: '📋', result_published: '📚',
  placement_update: '🎓', dropout_risk_alert: '⚠️', subject_assigned: '📝', default: '🔔',
};

export default function NotificationBell() {
  const { userId, role } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { panelOpen, unreadCount, items } = useSelector((s: RootState) => s.notifications);
  const panelRef = useRef<HTMLDivElement>(null);

  useNotifications(userId ?? '');
  const markReadMutation = useMarkNotificationRead();

  const viewAllPath = (role === 'college_admin' || role === 'super_admin')
    ? '/notifications'
    : `/${role?.replace('_cell', '')?.replace('examination', 'exam') ?? 'student'}/notifications`;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) dispatch(closePanel());
    };
    if (panelOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen, dispatch]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => dispatch(togglePanel())}
        className="relative p-2 rounded-lg transition-colors duration-150"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-elevated)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0
               00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159
               c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center
            rounded-full text-white text-[10px] font-bold"
            style={{ backgroundColor: 'var(--color-danger)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {panelOpen && (
        <div
          className="absolute right-0 top-11 w-80 z-50 rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card-lg)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="badge badge-primary text-2xs">{unreadCount} unread</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>No notifications yet</p>
              </div>
            ) : items.slice(0, 20).map((n: Notification) => (
              <button
                key={n.id}
                onClick={() => { if (n.delivery_status !== 'delivered') markReadMutation.mutate(n.id); }}
                className="w-full text-left px-4 py-3 transition-colors duration-100 flex gap-3 items-start"
                style={{
                  backgroundColor: n.delivery_status !== 'delivered'
                    ? 'var(--color-primary-muted)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.delivery_status !== 'delivered'
                  ? 'var(--color-primary-muted)' : 'transparent')}
              >
                <span className="text-base flex-shrink-0 mt-0.5">
                  {EVENT_ICONS[n.event_type] ?? EVENT_ICONS.default}
                </span>
                <div className="flex-1 min-w-0">
                  {n.subject && (
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-base)' }}>
                      {n.subject}
                    </p>
                  )}
                  <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {n.message}
                  </p>
                  <p className="text-2xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </p>
                </div>
                {n.delivery_status !== 'delivered' && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: 'var(--color-primary)' }} />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => { dispatch(closePanel()); navigate(viewAllPath); }}
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
