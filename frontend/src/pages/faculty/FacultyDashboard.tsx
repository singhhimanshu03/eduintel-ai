import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FacultyOverview from './FacultyOverview';
import MarkAttendance from './MarkAttendance';
import MarksEntry from './MarksEntry';

const NAV = [
  { label: 'Overview',       path: '/faculty',            icon: '📊' },
  { label: 'Mark Attendance', path: '/faculty/attendance', icon: '📋' },
  { label: 'Marks Entry',    path: '/faculty/marks',       icon: '✏️' },
];

export default function FacultyDashboard() {
  return (
    <DashboardLayout navItems={NAV} title="Faculty Dashboard">
      <Routes>
        <Route index element={<FacultyOverview />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="marks" element={<MarksEntry />} />
      </Routes>
    </DashboardLayout>
  );
}
