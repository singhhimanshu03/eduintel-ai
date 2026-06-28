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

// ── Theme toggle icons ──────────────────────────────────────────────────────
const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707
         M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);
const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

export default function DashboardLayout({ children, navItems, title }: Props) {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { role }   = useSelector((s: RootState) => s.auth);
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const roleLabel = role?.replace(/_/g, ' ') ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#121212] transition-colors duration-200">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-16'}
        transition-all duration-200 flex flex-col flex-shrink-0
        bg-indigo-900 dark:bg-[#181818]
        border-r border-indigo-800 dark:border-white/5
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-indigo-800 dark:border-white/5">
          <div className="w-8 h-8 bg-indigo-500 dark:bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">EI</span>
          </div>
          {sidebarOpen && (
            <div>
              <span className="text-white font-semibold text-sm block">EduIntel AI</span>
              <span className="text-indigo-400 dark:text-indigo-300 text-[10px] capitalize">{roleLabel}</span>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === navItems[0]?.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                    : 'text-indigo-300 dark:text-gray-400 hover:bg-indigo-800 dark:hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-indigo-800 dark:border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg
              text-indigo-300 dark:text-gray-400 hover:bg-indigo-800 dark:hover:bg-white/5
              hover:text-white text-sm transition-colors duration-150"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="
          bg-white dark:bg-[#1a1a1a]
          border-b border-gray-200 dark:border-white/10
          px-6 py-3 flex items-center justify-between flex-shrink-0
          transition-colors duration-200
        ">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400
                hover:text-gray-700 dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h1>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">

            {/* ── Theme Toggle ──────────────────────────────────────────── */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors duration-150
                text-gray-500 dark:text-yellow-400
                hover:bg-gray-100 dark:hover:bg-white/5
                border border-transparent hover:border-gray-200 dark:hover:border-white/10"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Notification bell */}
            <NotificationBell />

            {/* Role badge */}
            <span className="
              text-xs bg-indigo-100 dark:bg-indigo-900/50
              text-indigo-700 dark:text-indigo-300
              px-2.5 py-1 rounded-full capitalize font-medium hidden sm:block
            ">
              {roleLabel}
            </span>

            {/* Avatar */}
            <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-700 rounded-full
              flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {roleLabel?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#121212] transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
