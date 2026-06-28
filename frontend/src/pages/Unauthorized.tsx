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
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ backgroundColor: 'var(--color-danger-muted)' }}>🚫</div>
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>Access Denied</h1>
        <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          You don't have permission to access this page.
          Contact your administrator if you believe this is an error.
        </p>
      </div>
      <button
        onClick={() => navigate(role ? (ROLE_HOME[role] ?? '/login') : '/login', { replace: true })}
        className="btn-primary">
        ← Go to my Dashboard
      </button>
    </div>
  );
}
