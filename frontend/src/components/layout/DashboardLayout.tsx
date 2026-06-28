import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../ui/NotificationBell';
import api from '../../app/api';

interface NavItem { label: string; path: string; icon: string; }
interface Props { children: ReactNode; navItems: NavItem[]; title: string; }

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707
         M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);
const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function DashboardLayout({ children, navItems, title }: Props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role }  = useSelector((s: RootState) => s.auth);
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const roleLabel = role?.replace(/_/g, ' ') ?? '';
  const initial   = roleLabel?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col flex-shrink-0 transition-all duration-200`}
        style={{
          backgroundColor: '#0F172A',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', height: '60px' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
            style={{ background: 'var(--color-primary)' }}>
            EI
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate leading-tight">EduIntel AI</p>
              <p className="text-xs capitalize truncate" style={{ color: '#94A3B8' }}>{roleLabel}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === navItems[0]?.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 transition-colors duration-150 group relative ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
              })}
              onMouseEnter={e => {
                const isActive = (e.currentTarget as HTMLAnchorElement).getAttribute('aria-current') === 'page';
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                const isActive = (e.currentTarget as HTMLAnchorElement).getAttribute('aria-current') === 'page';
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <span className="text-base w-5 flex-shrink-0 text-center">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium
              text-slate-400 hover:text-white hover:bg-white/5 transition-colors duration-150"
          >
            <LogoutIcon />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{
            height: '60px',
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md transition-colors duration-150"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>

            <span
              className="text-sm font-semibold hidden sm:block"
              style={{ color: 'var(--color-text-base)' }}
            >
              {title}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Notification bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Role + avatar */}
            <div className="flex items-center gap-2">
              <span
                className="hidden md:block text-xs font-medium capitalize px-2 py-1 rounded-md"
                style={{
                  backgroundColor: 'var(--color-primary-muted)',
                  color: 'var(--color-primary)',
                }}
              >
                {roleLabel}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
