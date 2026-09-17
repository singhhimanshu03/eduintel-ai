import { useAttendanceAnalytics } from '../../hooks/useAttendance';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AttendanceAnalytics() {
  const { data, isLoading } = useAttendanceAnalytics();
  if (isLoading) return <LoadingSpinner />;

  const avgAtt  = data?.averageAttendance ? parseFloat(data.averageAttendance).toFixed(1) : '—';
  const below   = data?.studentsBelowThreshold ?? [];
  const subjects = data?.lowestSubjects ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Analytics" subtitle="Institution-wide attendance insights" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="animate-fade-in-up stagger-1">
          <StatCard title="Average Attendance" value={`${avgAtt}%`} icon="📊" color="indigo" />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatCard title="Below Threshold" value={below.length} icon="⚠️" color="red"
            subtitle="students" trend={below.length > 0 ? { value: `${below.length} flagged`, up: false } : undefined} />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatCard title="Subjects Tracked" value={subjects.length} icon="📋" color="yellow" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lowest Performing Subjects */}
        <div className="card p-5 animate-fade-in-up stagger-3">
          <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-base)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-danger)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898" />
            </svg>
            Lowest Performing Subjects
          </h3>
          <div className="space-y-3">
            {subjects.map((s: { subject_code: string; avg_att: string }, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium min-w-[80px]" style={{ color: 'var(--color-text-base)' }}>{s.subject_code}</span>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1 progress-bar">
                    <div className="h-full rounded-full" style={{
                      width: `${parseFloat(s.avg_att)}%`,
                      background: parseFloat(s.avg_att) < 60 ? 'var(--gradient-danger)' :
                                 parseFloat(s.avg_att) < 75 ? 'var(--gradient-warning)' : 'var(--gradient-success)',
                    }} />
                  </div>
                  <span className="text-xs font-bold w-12 text-right" style={{
                    color: parseFloat(s.avg_att) < 60 ? 'var(--color-danger)' :
                           parseFloat(s.avg_att) < 75 ? 'var(--color-warning)' : 'var(--color-success)',
                  }}>{parseFloat(s.avg_att).toFixed(1)}%</span>
                </div>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-faint)' }}>No data available</p>
            )}
          </div>
        </div>

        {/* Students Below Threshold */}
        <div className="card p-5 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--color-danger)' }} />
              Students Below Threshold
            </h3>
            {below.length > 0 && <span className="badge badge-danger text-[10px]">{below.length}</span>}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {below.length === 0 ? (
              <div className="text-center py-10 animate-fade-in">
                <div className="text-3xl mb-3">🎉</div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>All students are above threshold</p>
              </div>
            ) : below.map((s: { student_id: string; subject_code: string; attendance_percentage: number }, i: number) => (
              <div key={i} className="flex items-center justify-between py-2.5 group"
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                    {s.student_id.slice(-2)}
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>{s.student_id}</span>
                    <span className="ml-2 text-[10px] badge badge-neutral">{s.subject_code}</span>
                  </div>
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>{s.attendance_percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
