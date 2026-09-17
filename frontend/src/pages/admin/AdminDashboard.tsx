import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminOverview from './AdminOverview';
import StudentList from './StudentList';
import StudentDetail from './StudentDetail';
import CreateStudent from './CreateStudent';
import CreateUser from './CreateUser';
import FacultyManagement from './FacultyManagement';
import AttendanceAnalytics from './AttendanceAnalytics';
import FeeDefaulters from './FeeDefaulters';
import NotificationCenter from './NotificationCenter';
import ReportsPage from './ReportsPage';
import AIInsights from './AIInsights';

/* ── SVG Nav Icons ──────────────────────────────────────────────────────── */
const I = ({ d }: { d: string }) => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d} /></svg>
);

const NAV = [
  { label: 'Overview',      path: '/admin',                icon: <I d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm10.5 0A2.25 2.25 0 0116.5 3.75h1.5A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm10.5 0a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-2.25z" />, section: 'MAIN' },
  { label: 'Students',      path: '/admin/students',       icon: <I d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
  { label: 'Faculty',       path: '/admin/faculty',        icon: <I d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /> },
  { label: 'Create User',   path: '/admin/users/new',      icon: <I d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /> },
  { label: 'Attendance',    path: '/admin/attendance',     icon: <I d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,    section: 'ANALYTICS' },
  { label: 'Fee Defaulters', path: '/admin/defaulters',    icon: <I d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /> },
  { label: 'AI Insights',   path: '/admin/ai-insights',   icon: <I d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />, section: 'INSIGHTS' },
  { label: 'Reports',       path: '/admin/reports',        icon: <I d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> },
  { label: 'Notifications', path: '/admin/notifications',  icon: <I d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />, section: 'SYSTEM' },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={NAV} title="Admin Dashboard">
      <Routes>
        <Route index                    element={<AdminOverview />} />
        <Route path="students"          element={<StudentList />} />
        <Route path="students/new"      element={<CreateStudent />} />
        <Route path="students/:id"      element={<StudentDetail />} />
        <Route path="faculty"           element={<FacultyManagement />} />
        <Route path="users/new"         element={<CreateUser />} />
        <Route path="attendance"        element={<AttendanceAnalytics />} />
        <Route path="defaulters"        element={<FeeDefaulters />} />
        <Route path="ai-insights"       element={<AIInsights />} />
        <Route path="reports"           element={<ReportsPage />} />
        <Route path="notifications"     element={<NotificationCenter />} />
      </Routes>
    </DashboardLayout>
  );
}
