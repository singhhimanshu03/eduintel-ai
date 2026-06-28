import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StudentOverview from './StudentOverview';
import MyAttendance    from './MyAttendance';
import MyResults       from './MyResults';
import HallTicket      from './HallTicket';
import FeeStatus       from './FeeStatus';
import MyNotifications from '../notifications/MyNotifications';

const NAV = [
  { label: 'Overview',       path: '/student',               icon: '🏠' },
  { label: 'Attendance',     path: '/student/attendance',    icon: '📋' },
  { label: 'Results',        path: '/student/results',       icon: '📚' },
  { label: 'Fee Status',     path: '/student/fees',          icon: '💰' },
  { label: 'Hall Ticket',    path: '/student/hall-ticket',   icon: '🎫' },
  { label: 'Notifications',  path: '/student/notifications', icon: '🔔' },
];

export default function StudentDashboard() {
  return (
    <DashboardLayout navItems={NAV} title="Student Portal">
      <Routes>
        <Route index               element={<StudentOverview />} />
        <Route path="attendance"   element={<MyAttendance />} />
        <Route path="results"      element={<MyResults />} />
        <Route path="fees"         element={<FeeStatus />} />
        <Route path="hall-ticket"  element={<HallTicket />} />
        <Route path="notifications"element={<MyNotifications />} />
      </Routes>
    </DashboardLayout>
  );
}
