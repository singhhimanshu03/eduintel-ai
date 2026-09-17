import { useEffect, useRef, useState } from 'react';
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { userId, role } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { panelOpen, unreadCount, items } = useSelector((s: RootState) => s.notifications);
  const panelRef = useRef<HTMLDivElement>(null);
  const [shaking, setShaking] = useState(false);

  useNotifications(userId ?? '');
  const markReadMutation = useMarkNotificationRead();

  // Shake bell when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(t);
    }
  }, [unreadCount]);

  const viewAllPath = (role === 'college_admin' || role === 'super_admin')
    ? '/admin/notifications'
    : role === 'student'
    ? '/student/notifications'
    : '/notifications';

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
        className="btn-icon relative"
        aria-label="Notifications"
      >
        <svg className={`w-[18px] h-[18px] ${shaking ? 'animate-bell-shake' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-white text-[9px] font-bold animate-scale-in"
            style={{ background: 'var(--gradient-danger)', boxShadow: '0 0 6px rgba(239,68,68,0.4)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {panelOpen && (
        <div className="absolute right-0 top-12 w-80 z-50 rounded-xl overflow-hidden animate-slide-down"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-xl)',
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="badge badge-primary text-[10px]">{unreadCount} unread</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-14 text-center animate-fade-in">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-elevated)' }}>🔔</div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>No notifications yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>We'll notify you when something arrives</p>
              </div>
            ) : items.slice(0, 20).map((n: Notification) => (
              <button
                key={n.id}
                onClick={() => { if (n.delivery_status !== 'delivered') markReadMutation.mutate(n.id); }}
                className="w-full text-left px-4 py-3 transition-colors duration-100 flex gap-3 items-start
                  hover:bg-[var(--color-elevated)]"
                style={{
                  backgroundColor: n.delivery_status !== 'delivered' ? 'var(--color-primary-muted)' : 'transparent',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-elevated)' }}>
                  {EVENT_ICONS[n.event_type] ?? EVENT_ICONS.default}
                </div>
                <div className="flex-1 min-w-0">
                  {n.subject && (
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-base)' }}>
                      {n.subject}
                    </p>
                  )}
                  <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {n.message}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
                    {n.created_at ? timeAgo(n.created_at) : ''}
                  </p>
                </div>
                {n.delivery_status !== 'delivered' && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2 animate-pulse-dot"
                    style={{ backgroundColor: 'var(--color-primary)' }} />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => { dispatch(closePanel()); navigate(viewAllPath); }}
              className="text-xs font-semibold transition-colors duration-150 hover:underline"
              style={{ color: 'var(--color-primary)' }}>
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
