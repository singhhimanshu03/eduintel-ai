import { useFacultyDashboard } from '../../hooks/useDashboard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskBadge from '../../components/ui/RiskBadge';
import StatCard from '../../components/ui/StatCard';

export default function FacultyOverview() {
  const { data, isLoading, isError } = useFacultyDashboard();

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: 'var(--color-danger-muted)' }}>⚠️</div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Failed to load dashboard data. Please refresh the page.
        </p>
      </div>
    );
  }

  const flagged = data?.flaggedStudents?.data ?? [];
  // Backend key is attendanceSummary — not classAttendance (that was the bug)
  const att     = data?.attendanceSummary?.data;

  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card-glass p-6 relative overflow-hidden animate-fade-in-up">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'var(--gradient-primary)', filter: 'blur(50px)' }} />
        <div className="relative">
          <h1 className="text-xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>{greeting}, Professor 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Class performance and AI alerts for today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="animate-fade-in-up stagger-1">
          <StatCard
            title="Avg Class Attendance"
            value={att?.averageAttendance ? `${parseFloat(att.averageAttendance).toFixed(1)}%` : '—'}
            icon="📋"
            color="indigo"
          />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatCard
            title="AI-Flagged Students"
            value={flagged.length}
            icon="⚠️"
            color="red"
            trend={flagged.length > 0 ? { value: `${flagged.length} at risk`, up: false } : undefined}
          />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatCard
            title="Below Threshold"
            value={att?.studentsBelowThreshold?.length ?? 0}
            icon="📉"
            color="yellow"
          />
        </div>
      </div>

      <div className="card p-5 animate-fade-in-up stagger-4">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25" />
            </svg>
            AI-Flagged Students
          </p>
          {flagged.length > 0 && <span className="badge badge-danger text-[10px]">{flagged.length}</span>}
        </div>

        {flagged.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: 'var(--color-success-muted)' }}>✅</div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              No students flagged — class is performing well!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {flagged.slice(0, 15).map((s: {
              student_id: string;
              student_name?: string;
              risk_score: string;
              avg_attendance?: number;
              recommended_action?: string;
            }, i: number) => (
              <div key={i}
                className="flex items-center justify-between p-3 rounded-xl transition-colors duration-100 hover:bg-[var(--color-primary-muted)]"
                style={{ backgroundColor: 'var(--color-elevated)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                    {(s.student_name ?? s.student_id).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-base)' }}>
                      {s.student_name ?? s.student_id}
                    </span>
                    {s.avg_attendance != null && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                        Attendance: {s.avg_attendance}%
                      </p>
                    )}
                    {s.recommended_action && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                        {s.recommended_action}
                      </p>
                    )}
                  </div>
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
