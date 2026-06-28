import { useAdminDashboard } from '../../hooks/useDashboard';
import StatCard from '../../components/ui/StatCard';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import FeeCollectionChart from '../../components/charts/FeeCollectionChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskBadge from '../../components/ui/RiskBadge';
import PageHeader from '../../components/ui/PageHeader';

export default function AdminOverview() {
  const { data, isLoading } = useAdminDashboard();
  if (isLoading) return <LoadingSpinner message="Loading dashboard…" />;

  const att    = data?.attendance?.data;
  const fees   = data?.fees?.data;
  const ai     = data?.aiInsights?.data;
  const feeSum = fees?.summary ?? [];
  const paid   = feeSum.find((s: { fee_status: string }) => s.fee_status === 'paid');
  const totalCollected = paid?.total_collected ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Overview" subtitle="Real-time academic intelligence snapshot" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students"    value={data?.students?.total ?? '—'} icon="👥" color="indigo" />
        <StatCard title="Avg Attendance"    value={att ? `${parseFloat(att.averageAttendance ?? 0).toFixed(1)}%` : '—'} icon="📋" color="green" />
        <StatCard title="Fee Collected"     value={totalCollected ? `₹${Number(totalCollected).toLocaleString()}` : '—'} icon="💰" color="green" />
        <StatCard title="High-Risk Students" value={ai?.high ?? '—'} icon="⚠️" color="red" subtitle="Eligibility risk" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart low={ai?.low ?? 0} medium={ai?.medium ?? 0} high={ai?.high ?? 0} />
        <FeeCollectionChart data={fees?.dailyCollection ?? []} />
      </div>

      <div className="card p-4 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          ⚠️ Students Below Attendance Threshold
        </h3>
        {att?.studentsBelowThreshold?.length ? (
          <div className="space-y-2">
            {att.studentsBelowThreshold.slice(0, 10).map((s: { student_id: string; subject_code: string; attendance_percentage: number }, i: number) => (
              <div key={i} className="flex items-center justify-between py-2
                border-b border-gray-100 dark:border-white/5 last:border-0">
                <div>
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{s.student_id}</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{s.subject_code}</span>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">{s.attendance_percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            All students are above the threshold 🎉
          </p>
        )}
      </div>
    </div>
  );
}
