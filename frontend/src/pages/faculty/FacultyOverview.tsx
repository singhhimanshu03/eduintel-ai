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

      <div className="card p-5 transition-colors duration-200">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">🤖 AI-Flagged Students</h3>
        {flagged.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
            No students flagged — class is performing well!
          </p>
        ) : (
          <div className="space-y-2">
            {flagged.slice(0, 15).map((s: { student_id: string; risk_score: string; recommended_action?: string }, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg
                bg-gray-50 dark:bg-white/5">
                <div>
                  <span className="font-medium text-sm text-gray-800 dark:text-white">{s.student_id}</span>
                  {s.recommended_action && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.recommended_action}</p>
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
