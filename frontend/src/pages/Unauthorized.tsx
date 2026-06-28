import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_HOME: Record<string, string> = {
  super_admin: '/admin', college_admin: '/admin', faculty: '/faculty',
  student: '/student',  parent: '/parent', examination_cell: '/exam', placement_cell: '/placement',
};

export default function Unauthorized() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <span className="text-6xl">🚫</span>
      <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
      <p className="text-gray-500 text-sm max-w-sm text-center">
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <button
        onClick={() => navigate(role ? (ROLE_HOME[role] ?? '/login') : '/login', { replace: true })}
        className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">
        ← Go to my Dashboard
      </button>
    </div>
  );
}
