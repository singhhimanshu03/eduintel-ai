import { useAuth } from '../../hooks/useAuth';
import { useStudentDashboard } from '../../hooks/useDashboard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AttendanceChart from '../../components/charts/AttendanceChart';
import RiskBadge from '../../components/ui/RiskBadge';
import StatCard from '../../components/ui/StatCard';

/**
 * Convert the attendance_percentage-based array the backend returns into the
 * { total_present, total_absent } shape that AttendanceChart expects.
 */
function toChartData(
  attendance: Array<{
    subject_code: string;
    attendance_percentage: string | number;
    total_classes?: number;
    attended_classes?: number;
  }>
): Array<{ subject_code: string; total_present: number; total_absent: number }> {
  return attendance.map(a => {
    const pct     = parseFloat(String(a.attendance_percentage));
    const total   = a.total_classes    ?? 100;
    const present = a.attended_classes ?? Math.round((pct / 100) * total);
    const absent  = total - present;
    return { subject_code: a.subject_code, total_present: present, total_absent: absent };
  });
}

export default function StudentOverview() {
  const { userId } = useAuth();
  const { data, isLoading, isError } = useStudentDashboard(userId ?? '');

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: 'var(--color-danger-muted)' }}>⚠️</div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Failed to load your dashboard. Please refresh the page.
        </p>
      </div>
    );
  }

  // ── Data extraction ───────────────────────────────────────────────────────
  const attendance: Array<{
    subject_code: string;
    attendance_percentage: string | number;
    total_classes?: number;
    attended_classes?: number;
  }> = data?.attendance?.data ?? [];

  const recs    = data?.recommendations;
  const results = data?.results?.data;

  const semGPA    = results?.semesterGPA ?? {};
  const latestSem = Object.keys(semGPA).sort().pop();
  const currentGPA = latestSem ? semGPA[latestSem] : null;

  const avgAtt = attendance.length
    ? (attendance.reduce((s, a) => s + parseFloat(String(a.attendance_percentage)), 0) / attendance.length).toFixed(1)
    : null;

  // Convert to the shape AttendanceChart actually expects
  const chartData = toChartData(attendance);

  const greeting = new Date().getHours() < 12 ? 'Good Morning'
    : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="card-glass p-6 relative overflow-hidden animate-fade-in-up">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'var(--gradient-primary)', filter: 'blur(50px)' }} />
        <div className="relative">
          <h1 className="text-xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
            {greeting}, Student 🎓
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Here's your academic snapshot.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in-up stagger-1">
          <StatCard
            title="Current GPA"
            value={currentGPA != null ? currentGPA : '—'}
            icon="🎯"
            color="indigo"
          />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatCard
            title="Avg Attendance"
            value={avgAtt != null ? `${avgAtt}%` : '—'}
            icon="📋"
            color="green"
          />
        </div>
        <div className="animate-fade-in-up stagger-3">
          {/* Show '—' not 0 when results haven't loaded — 0 backlogs is genuinely 0 */}
          <StatCard
            title="Backlogs"
            value={results != null ? (results.backlogs?.length ?? 0) : '—'}
            icon="📌"
            color="yellow"
          />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <div className="card card-hover-lift p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-faint)' }}>AI Risk Level</p>
            <div className="mt-2">
              {recs?.overall_risk
                ? <RiskBadge risk={recs.overall_risk} size="md" />
                : <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>—</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Chart — only shown when real data available */}
      {chartData.length > 0 && (
        <div className="animate-fade-in-up stagger-4">
          <AttendanceChart data={chartData} />
        </div>
      )}

      {/* AI Recommendations */}
      {recs && (
        <div className="card-glass p-5 relative overflow-hidden animate-fade-in-up stagger-5">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-15 pointer-events-none"
            style={{ background: 'var(--gradient-primary)', filter: 'blur(40px)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                style={{ background: 'var(--gradient-primary)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25" />
                </svg>
              </div>
              <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
                AI Improvement Plan
              </h3>
              {recs.overall_risk && <RiskBadge risk={recs.overall_risk} />}
            </div>

            {(recs.improvement_plan ?? []).length > 0 && (
              <ul className="space-y-2.5">
                {recs.improvement_plan.map((step: string, i: number) => (
                  <li key={i} className="flex gap-2.5 text-sm p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-text-muted)' }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: 'var(--gradient-primary)' }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            )}

            {(recs.subjects_needing_attention ?? []).length > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <p className="text-xs font-bold flex items-center gap-1.5 mb-2.5"
                  style={{ color: 'var(--color-danger)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                    style={{ backgroundColor: 'var(--color-danger)' }} />
                  Subjects needing attention
                </p>
                <div className="flex flex-wrap gap-2">
                  {recs.subjects_needing_attention.map((s: string) => (
                    <span key={s} className="badge badge-danger">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
