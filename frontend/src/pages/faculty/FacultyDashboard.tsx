import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FacultyOverview from './FacultyOverview';
import MarkAttendance from './MarkAttendance';
import MarksEntry from './MarksEntry';

const I = ({ d }: { d: string }) => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d} /></svg>
);

const NAV = [
  { label: 'Overview',        path: '/faculty',            icon: <I d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm10.5 0A2.25 2.25 0 0116.5 3.75h1.5A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm10.5 0a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-2.25z" /> },
  { label: 'Mark Attendance', path: '/faculty/attendance',  icon: <I d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { label: 'Marks Entry',     path: '/faculty/marks',       icon: <I d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /> },
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
