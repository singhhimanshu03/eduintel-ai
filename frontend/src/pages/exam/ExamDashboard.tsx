import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ExamOverview from './ExamOverview';
import HallTicketManagement from './HallTicketManagement';
import ResultPublish from './ResultPublish';

const I = ({ d }: { d: string }) => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={d} /></svg>
);

const NAV = [
  { label: 'Overview',        path: '/exam',              icon: <I d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm10.5 0A2.25 2.25 0 0116.5 3.75h1.5A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm10.5 0a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-2.25z" /> },
  { label: 'Hall Tickets',    path: '/exam/hall-tickets',  icon: <I d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /> },
  { label: 'Publish Results',  path: '/exam/results',      icon: <I d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a1.125 1.125 0 01-1.518-.44 16.13 16.13 0 01-1.412-3.836m5.065.326c-.688-.06-1.386-.09-2.09-.09m0 0a48.844 48.844 0 00-8.9-1.067M10.34 6.66a48.844 48.844 0 00-8.9 1.067" /> },
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
