import { useState } from 'react';
import { useParentDashboard } from '../../hooks/useDashboard';
import PageHeader from '../../components/ui/PageHeader';
import AttendanceChart from '../../components/charts/AttendanceChart';
import RiskBadge from '../../components/ui/RiskBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';

export default function ParentOverview() {
  const [inputId, setInputId]             = useState('');
  const [linkedStudentId, setLinkedStudentId] = useState('');
  const { data, isLoading } = useParentDashboard(linkedStudentId);

  const handleLink = () => { if (inputId.trim()) setLinkedStudentId(inputId.trim()); };

  if (!linkedStudentId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: 'var(--color-primary-muted)' }}>
          👨‍👩‍👧
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-base)' }}>
            Parent Portal
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Enter your child's Student ID to view their academic progress,
            attendance, and AI risk indicators.
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <input
            className="input-base flex-1"
            placeholder="Student ID (e.g. UUID)"
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLink()}
          />
          <button onClick={handleLink} disabled={!inputId.trim()} className="btn-primary flex-shrink-0">
            View
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          Contact the college admin if you don't know your child's Student ID.
        </p>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner message="Loading academic data…" />;

  const attendance: Array<{ subject_code: string; attendance_percentage: string }> =
    data?.attendance?.data ?? [];
  const results    = data?.results?.data;
  const risk       = data?.riskScore?.data;
  const semGPA     = results?.semesterGPA ?? {};
  const latestSem  = Object.keys(semGPA).sort().pop();
  const avgAtt     = attendance.length
    ? (attendance.reduce((s, a) => s + parseFloat(a.attendance_percentage), 0) / attendance.length).toFixed(1)
    : '—';
  const chartData  = attendance.map(a => ({ subject: a.subject_code, attendance: parseFloat(a.attendance_percentage) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Child's Academic Overview"
        subtitle={`Student ID: ${linkedStudentId}`}
        action={
          <button
            onClick={() => { setLinkedStudentId(''); setInputId(''); }}
            className="btn-ghost text-xs"
          >
            ← Change student
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Average Attendance" value={`${avgAtt}%`} icon="📋" color="indigo" />
        <StatCard title="Current GPA" value={latestSem ? semGPA[latestSem] ?? '—' : '—'} icon="📚" color="green" />
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide mb-3"
            style={{ color: 'var(--color-text-faint)' }}>AI Risk Level</p>
          <RiskBadge risk={risk?.risk_score ?? 'Low'} size="md" />
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-faint)' }}>
            Based on attendance, marks &amp; fees
          </p>
        </div>
      </div>

      {chartData.length > 0 && <AttendanceChart data={chartData} />}

      {results?.backlogs?.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-danger)' }}>
            ⚠️ Active Backlogs ({results.backlogs.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {results.backlogs.map((b: { subject_code: string; semester: number }, i: number) => (
              <span key={i} className="badge badge-danger">
                {b.subject_code} · Sem {b.semester}
              </span>
            ))}
          </div>
        </div>
      )}

      {!data && !isLoading && (
        <div className="card p-5 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No data found for Student ID <strong style={{ color: 'var(--color-text-base)' }}>{linkedStudentId}</strong>.
            Please check the ID or contact the admin.
          </p>
        </div>
      )}
    </div>
  );
}
