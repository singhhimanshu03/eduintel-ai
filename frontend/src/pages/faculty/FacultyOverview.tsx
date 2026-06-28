import { useFacultyDashboard } from '../../hooks/useDashboard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskBadge from '../../components/ui/RiskBadge';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

export default function FacultyOverview() {
  const { data, isLoading } = useFacultyDashboard();
  if (isLoading) return <LoadingSpinner />;

  const flagged = data?.flaggedStudents?.data ?? [];
  const att     = data?.classAttendance?.data;

  return (
    <div className="space-y-6">
      <PageHeader title="My Dashboard" subtitle="Class performance and AI alerts" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Avg Class Attendance" value={att?.averageAttendance ? `${parseFloat(att.averageAttendance).toFixed(1)}%` : '—'} icon="📋" color="indigo" />
        <StatCard title="AI-Flagged Students"  value={flagged.length} icon="⚠️" color="red" />
        <StatCard title="Below Threshold"       value={att?.studentsBelowThreshold?.length ?? 0} icon="📉" color="yellow" />
      </div>

      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: 'var(--color-text-faint)' }}>
          🤖 AI-Flagged Students
        </p>
        {flagged.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <span className="text-2xl opacity-40">✅</span>
            <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
              No students flagged — class is performing well!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {flagged.slice(0, 15).map((s: { student_id: string; risk_score: string; recommended_action?: string }, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg transition-colors duration-100"
                style={{ backgroundColor: 'var(--color-elevated)' }}>
                <div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-base)' }}>
                    {s.student_id}
                  </span>
                  {s.recommended_action && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {s.recommended_action}
                    </p>
                  )}
                </div>
                <RiskBadge risk={s.risk_score} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
