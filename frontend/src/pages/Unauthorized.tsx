import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_HOME: Record<string, string> = {
  super_admin: '/admin', college_admin: '/admin', faculty: '/faculty',
  student: '/student', parent: '/parent', examination_cell: '/exam', placement_cell: '/placement',
};

export default function Unauthorized() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Shield icon */}
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center animate-fade-in-up"
        style={{ backgroundColor: 'var(--color-danger-muted)' }}>
        <svg className="w-10 h-10" fill="none" stroke="var(--color-danger)" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>

      <div className="text-center animate-fade-in-up stagger-1">
        <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
          Access Denied
        </h1>
        <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          You don't have permission to access this page.
          Contact your administrator if you believe this is an error.
        </p>
      </div>

      <button
        onClick={() => navigate(role ? (ROLE_HOME[role] ?? '/login') : '/login', { replace: true })}
        className="btn-primary animate-fade-in-up stagger-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Go to my Dashboard
      </button>
    </div>
  );
}
