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

      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-text-faint)' }}>
          ⚠️ Students Below Attendance Threshold
        </p>
        {att?.studentsBelowThreshold?.length ? (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {att.studentsBelowThreshold.slice(0, 10).map((s: { student_id: string; subject_code: string; attendance_percentage: number }, i: number) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--color-text-base)' }}>
                    {s.student_id}
                  </span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--color-text-faint)' }}>
                    {s.subject_code}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
                  {s.attendance_percentage}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--color-text-faint)' }}>
            All students are above the threshold 🎉
          </p>
        )}
      </div>
    </div>
  );
}
