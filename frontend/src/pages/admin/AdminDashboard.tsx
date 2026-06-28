import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminOverview       from './AdminOverview';
import StudentList         from './StudentList';
import StudentDetail       from './StudentDetail';
import CreateStudent       from './CreateStudent';
import FeeDefaulters       from './FeeDefaulters';
import AttendanceAnalytics from './AttendanceAnalytics';
import ReportsPage         from './ReportsPage';
import AIInsights          from './AIInsights';
import NotificationCenter  from './NotificationCenter';

const NAV = [
  { label: 'Overview',       path: '/admin',                icon: '📊' },
  { label: 'Students',       path: '/admin/students',        icon: '👥' },
  { label: 'Attendance',     path: '/admin/attendance',      icon: '📋' },
  { label: 'Fees',           path: '/admin/fees',            icon: '💰' },
  { label: 'AI Insights',    path: '/admin/ai',              icon: '🤖' },
  { label: 'Notifications',  path: '/admin/notifications',   icon: '🔔' },
  { label: 'Reports',        path: '/admin/reports',         icon: '📄' },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={NAV} title="Admin Dashboard">
      <Routes>
        <Route index                       element={<AdminOverview />} />
        <Route path="students"             element={<StudentList />} />
        <Route path="students/new"         element={<CreateStudent />} />
        <Route path="students/:id"         element={<StudentDetail />} />
        <Route path="attendance"           element={<AttendanceAnalytics />} />
        <Route path="fees"                 element={<FeeDefaulters />} />
        <Route path="ai"                   element={<AIInsights />} />
        <Route path="notifications"        element={<NotificationCenter />} />
        <Route path="reports"              element={<ReportsPage />} />
      </Routes>
    </DashboardLayout>
  );
}
