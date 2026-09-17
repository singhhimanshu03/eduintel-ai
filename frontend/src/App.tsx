import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppRoutes from './router/AppRoutes';

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // api.ts dispatches this event instead of doing window.location.href = '/login'
    // so that navigation stays inside React Router (no full-page reload).
    const handler = () => navigate('/login', { replace: true });
    window.addEventListener('auth:logout-redirect', handler);
    return () => window.removeEventListener('auth:logout-redirect', handler);
  }, [navigate]);

  return <AppRoutes />;
}
