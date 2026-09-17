import { useLocation, Link } from 'react-router-dom';

/* ─── Route label map ───────────────────────────────────────────────────── */
const LABELS: Record<string, string> = {
  admin:          'Admin',
  faculty:        'Faculty',
  student:        'Student',
  parent:         'Parent',
  exam:           'Examination',
  placement:      'Placement',
  notifications:  'Notifications',
  attendance:     'Attendance',
  students:       'Students',
  results:        'Results',
  marks:          'Marks Entry',
  fees:           'Fees',
  'hall-ticket':  'Hall Ticket',
  'hall-tickets': 'Hall Tickets',
  companies:      'Companies',
  drives:         'Recruitment Drives',
  profile:        'AI Profile',
  'ai-insights':  'AI Insights',
  analytics:      'Analytics',
  reports:        'Reports',
  overview:       'Overview',
  new:            'Add New',
  defaulters:     'Fee Defaulters',
  'change-password': 'Change Password',
};

/** Auto-builds breadcrumbs from the current URL path. */
export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const path  = '/' + segments.slice(0, i + 1).join('/');
    const label = LABELS[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium">
      {/* Home icon */}
      <Link to="/" className="transition-colors duration-150 hover:text-[var(--color-primary)]"
        style={{ color: 'var(--color-text-faint)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </Link>

      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {/* Separator */}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>

          {crumb.isLast ? (
            <span style={{ color: 'var(--color-text-base)' }}>{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="transition-colors duration-150 hover:text-[var(--color-primary)]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
