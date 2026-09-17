import { ReactNode, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../ui/NotificationBell';
import Breadcrumb from '../ui/Breadcrumb';
import api from '../../app/api';

/* ─── Types ───────────────────────────────────────────────────────────── */
interface NavItem { label: string; path: string; icon: ReactNode; section?: string; }
interface Props  { children: ReactNode; navItems: NavItem[]; title: string; }

/* ─── SVG Icon Components ─────────────────────────────────────────────── */
const Icon = ({ d, className = 'w-[18px] h-[18px]' }: { d: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);

const SunIcon  = () => <Icon d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />;
const MoonIcon = () => <Icon d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />;
const SearchIcon = () => <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4" />;
const MenuIcon   = () => <Icon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" className="w-5 h-5" />;
const ChevronL   = () => <Icon d="M15 19l-7-7 7-7" className="w-4 h-4" />;
const ChevronR   = () => <Icon d="M9 5l7 7-7 7" className="w-4 h-4" />;

const LogoutIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

/* ─── Helper: Group nav items by section ──────────────────────────────── */
function groupNavItems(items: NavItem[]) {
  const groups: { section: string; items: NavItem[] }[] = [];
  let currentSection = '';

  for (const item of items) {
    const sec = item.section ?? '';

    if (groups.length === 0 || sec !== currentSection) {
      currentSection = sec;
      groups.push({ section: sec, items: [] });
    }

    groups[groups.length - 1].items.push(item);
  }

  return groups;
}

/* ═════════════════════════════════════════════════════════════════════════
   DASHBOARD LAYOUT
   Premium sidebar + glassmorphism navbar + breadcrumbs
═════════════════════════════════════════════════════════════════════════ */
export default function DashboardLayout({ children, navItems, title }: Props) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { role, userId, refreshToken }  = useSelector((s: RootState) => s.auth);
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { refreshToken }); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const roleLabel = role?.replace(/_/g, ' ') ?? '';
  const initials  = roleLabel.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 2) || '?';

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const groups = groupNavItems(navItems);

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          width: collapsed ? 'var(--sidebar-w-mini)' : 'var(--sidebar-w)',
          background: isDark
            ? 'rgba(15, 23, 42, 0.75)'
            : 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)'}`,
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-4 flex-shrink-0"
          style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}>
            EI
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-white font-heading font-bold text-sm tracking-tight leading-tight">EduIntel AI</p>
              <p className="text-[11px] capitalize leading-tight" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                {roleLabel}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {groups.map((group, gi) => (
            <div key={gi}>
              {/* Section label */}
              {group.section && !collapsed && (
                <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  {group.section}
                </p>
              )}
              {group.section && collapsed && <div className="my-3 mx-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />}

              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === navItems[0]?.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                     transition-all duration-200 relative ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active accent bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: 'var(--gradient-primary)' }} />
                      )}
                      {/* Icon */}
                      <span className={`flex-shrink-0 transition-colors duration-150 ${
                        isActive ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'
                      }`}>
                        {item.icon}
                      </span>
                      {/* Label */}
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {/* Hover glow for active */}
                      {isActive && (
                        <span className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)' }} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar footer — user profile + actions */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-slate-500
              hover:text-white hover:bg-white/5 transition-all duration-150 mb-2"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronR /> : <ChevronL />}
            {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
          </button>

          {/* Change Password */}
          <button
            onClick={() => navigate('/change-password')}
            title={collapsed ? 'Change Password' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium
              text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-150 mb-1"
          >
            <KeyIcon />
            {!collapsed && <span>Change Password</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium
              text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogoutIcon />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* User card */}
          {!collapsed && (
            <div className="mt-3 p-3 rounded-xl flex items-center gap-3 animate-fade-in"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{userId?.slice(0, 8) ?? 'User'}...</p>
                <p className="text-[10px] capitalize truncate" style={{ color: 'rgba(148, 163, 184, 0.6)' }}>
                  {roleLabel}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top Navbar ──────────────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0 relative z-20"
          style={{
            height: '64px',
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.8)'}`,
          }}
        >
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="btn-icon lg:hidden"
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>

            {/* Page title */}
            <div className="hidden sm:block">
              <h1 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
                {title}
              </h1>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* Search bar */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-200"
                style={{
                  backgroundColor: 'var(--color-elevated)',
                  color: 'var(--color-text-faint)',
                  border: '1px solid var(--color-border)',
                  minWidth: searchOpen ? '280px' : '180px',
                }}
              >
                <SearchIcon />
                <span>Search…</span>
                <kbd className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-faint)',
                  }}>
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Notification bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl transition-all duration-150
                  hover:bg-[var(--color-elevated)]"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--gradient-primary)' }}>
                  {initials}
                </div>
                {/* Name + role */}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-text-base)' }}>
                    {roleLabel.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                  <p className="text-[10px] leading-tight" style={{ color: 'var(--color-text-faint)' }}>
                    {userId?.slice(0, 8)}...
                  </p>
                </div>
                {/* Chevron */}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 hidden md:block ${profileOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  style={{ color: 'var(--color-text-faint)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-xl overflow-hidden animate-slide-down z-50"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xl)',
                  }}>
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                      {roleLabel.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                      ID: {userId?.slice(0, 12)}...
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button onClick={() => { setProfileOpen(false); navigate('/change-password'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100
                        hover:bg-[var(--color-elevated)]"
                      style={{ color: 'var(--color-text-muted)' }}>
                      <KeyIcon /> Change Password
                    </button>
                    <button onClick={() => { setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100
                        hover:bg-[var(--color-elevated)]"
                      style={{ color: 'var(--color-text-muted)' }}>
                      <SettingsIcon /> Settings
                    </button>
                  </div>

                  {/* Logout */}
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100
                        hover:bg-red-500/10 text-red-500">
                      <LogoutIcon /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <div className="px-6 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Breadcrumb />
        </div>

        {/* ── Page content ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="animate-fade-in-up max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
