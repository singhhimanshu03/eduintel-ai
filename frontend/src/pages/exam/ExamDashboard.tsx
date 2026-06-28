import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ExamOverview from './ExamOverview';
import HallTicketManagement from './HallTicketManagement';
import ResultPublish from './ResultPublish';

const NAV = [
  { label: 'Overview',       path: '/exam',               icon: '📋' },
  { label: 'Hall Tickets',   path: '/exam/hall-tickets',  icon: '🎫' },
  { label: 'Publish Results', path: '/exam/results',      icon: '📢' },
];

export default function ExamDashboard() {
  return (
    <DashboardLayout navItems={NAV} title="Examination Cell">
      <Routes>
        <Route index element={<ExamOverview />} />
        <Route path="hall-tickets" element={<HallTicketManagement />} />
        <Route path="results" element={<ResultPublish />} />
      </Routes>
    </DashboardLayout>
  );
}
