import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';

// Auth pages
import Login          from '../pages/Login';
import Register       from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword  from '../pages/ResetPassword';
import Unauthorized   from '../pages/Unauthorized';
import NotFound       from '../pages/NotFound';

// Standalone pages accessible from any role
import NotificationCenter from '../pages/admin/NotificationCenter';
import MyNotifications    from '../pages/notifications/MyNotifications';

// Dashboards
import AdminDashboard     from '../pages/admin/AdminDashboard';
import FacultyDashboard   from '../pages/faculty/FacultyDashboard';
import StudentDashboard   from '../pages/student/StudentDashboard';
import ParentDashboard    from '../pages/parent/ParentDashboard';
import ExamDashboard      from '../pages/exam/ExamDashboard';
import PlacementDashboard from '../pages/placement/PlacementDashboard';

const ROLE_HOME: Record<string, string> = {
  super_admin:      '/admin',
  college_admin:    '/admin',
  faculty:          '/faculty',
  student:          '/student',
  parent:           '/parent',
  examination_cell: '/exam',
  placement_cell:   '/placement',
};

export default function AppRoutes() {
  const { isAuthenticated, role } = useAuth();
  const home = role ? (ROLE_HOME[role] ?? '/login') : '/login';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"           element={isAuthenticated ? <Navigate to={home} replace /> : <Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/unauthorized"    element={<Unauthorized />} />

      {/* Admin */}
      <Route path="/admin/*" element={
        <RoleBasedRoute allowedRoles={['super_admin', 'college_admin']}>
          <AdminDashboard />
        </RoleBasedRoute>
      } />

      {/* Faculty */}
      <Route path="/faculty/*" element={
        <RoleBasedRoute allowedRoles={['faculty']}>
          <FacultyDashboard />
        </RoleBasedRoute>
      } />

      {/* Student */}
      <Route path="/student/*" element={
        <RoleBasedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </RoleBasedRoute>
      } />

      {/* Parent */}
      <Route path="/parent/*" element={
        <RoleBasedRoute allowedRoles={['parent']}>
          <ParentDashboard />
        </RoleBasedRoute>
      } />

      {/* Examination Cell */}
      <Route path="/exam/*" element={
        <RoleBasedRoute allowedRoles={['examination_cell']}>
          <ExamDashboard />
        </RoleBasedRoute>
      } />

      {/* Placement Cell */}
      <Route path="/placement/*" element={
        <RoleBasedRoute allowedRoles={['placement_cell']}>
          <PlacementDashboard />
        </RoleBasedRoute>
      } />

      {/* Notifications — role-aware:
            admin/super_admin → compose + send (NotificationCenter)
            all other roles  → read-only personal list (MyNotifications)       */}
      <Route path="/notifications" element={
        <ProtectedRoute>
          {role === 'college_admin' || role === 'super_admin'
            ? <NotificationCenter />
            : <MyNotifications />
          }
        </ProtectedRoute>
      } />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? home : '/login'} replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
