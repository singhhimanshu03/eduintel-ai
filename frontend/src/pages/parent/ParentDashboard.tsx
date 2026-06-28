import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ParentOverview from './ParentOverview';

const NAV = [{ label: 'My Child', path: '/parent', icon: '👨‍👩‍👧' }];

export default function ParentDashboard() {
  return (
    <DashboardLayout navItems={NAV} title="Parent Portal">
      <Routes>
        <Route index element={<ParentOverview />} />
      </Routes>
    </DashboardLayout>
  );
}
