import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleBasedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // Not logged in — send to login, preserving the attempted URL so the
  // login page can redirect back after successful authentication.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role
  if (!role || !allowedRoles.includes(role as UserRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
