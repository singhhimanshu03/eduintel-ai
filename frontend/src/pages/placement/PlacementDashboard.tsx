import { Routes, Route } from 'react-router-dom';
import DashboardLayout     from '../../components/layout/DashboardLayout';
import PlacementOverview   from './PlacementOverview';
import CompanyManagement   from './CompanyManagement';
import PlacementProfile    from './PlacementProfile';
import RecruitmentDrives   from './RecruitmentDrives';

const I = ({ d }: { d: string }) => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d} /></svg>
);

const NAV = [
  { label: 'Overview',    path: '/placement',            icon: <I d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /> },
  { label: 'Companies',   path: '/placement/companies',  icon: <I d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /> },
  { label: 'Drives',      path: '/placement/drives',     icon: <I d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /> },
  { label: 'AI Profile',  path: '/placement/profile',    icon: <I d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /> },
];

export default function PlacementDashboard() {
  return (
    <DashboardLayout navItems={NAV} title="Placement Cell">
      <Routes>
        <Route index              element={<PlacementOverview />} />
        <Route path="companies"   element={<CompanyManagement />} />
        <Route path="drives"      element={<RecruitmentDrives />} />
        <Route path="profile"     element={<PlacementProfile />} />
      </Routes>
    </DashboardLayout>
  );
}
