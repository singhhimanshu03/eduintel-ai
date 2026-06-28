import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../app/store';
import { togglePanel, closePanel, markRead } from '../../features/notifications/notificationSlice';
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
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        dispatch(closePanel());
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen, dispatch]);

  const handleNotificationClick = (n: Notification) => {
    if (n.delivery_status !== 'delivered') markReadMutation.mutate(n.id);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => dispatch(togglePanel())}
        className="relative p-2 rounded-lg transition-colors
          text-gray-500 dark:text-gray-400
          hover:text-gray-700 dark:hover:text-white
          hover:bg-gray-100 dark:hover:bg-white/5"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4
               0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center
            rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className="absolute right-0 top-10 w-80 z-50 rounded-xl shadow-xl overflow-hidden
          bg-white dark:bg-[#1e1e1e]
          border border-gray-200 dark:border-white/10">

          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10
            flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
            {items.length === 0 ? (
              <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                <div className="text-3xl mb-2">🔔</div>
                No notifications yet
              </div>
            ) : items.slice(0, 20).map(n => (
              <button key={n.id} onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-4 py-3 transition flex gap-3 items-start
                  hover:bg-gray-50 dark:hover:bg-white/5
                  ${n.delivery_status !== 'delivered'
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : ''}`}>
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {EVENT_ICONS[n.event_type] ?? EVENT_ICONS.default}
                </span>
                <div className="flex-1 min-w-0">
                  {n.subject && (
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{n.subject}</p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </p>
                </div>
                {n.delivery_status !== 'delivered' && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 dark:border-white/10 text-center">
            <button
              onClick={() => { dispatch(closePanel()); navigate(viewAllPath); }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
