import { Routes, Route } from 'react-router-dom';
import DashboardLayout     from '../../components/layout/DashboardLayout';
import PlacementOverview   from './PlacementOverview';
import CompanyManagement   from './CompanyManagement';
import PlacementProfile    from './PlacementProfile';
import RecruitmentDrives   from './RecruitmentDrives';

const NAV = [
  { label: 'Overview',   path: '/placement',           icon: '📊' },
  { label: 'Companies',  path: '/placement/companies', icon: '🏢' },
  { label: 'Drives',     path: '/placement/drives',    icon: '🚀' },
  { label: 'AI Profile', path: '/placement/profile',   icon: '🤖' },
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
