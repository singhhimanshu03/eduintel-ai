import { useState } from 'react';
import { useParentDashboard } from '../../hooks/useDashboard';
import PageHeader from '../../components/ui/PageHeader';
import AttendanceChart from '../../components/charts/AttendanceChart';
import RiskBadge from '../../components/ui/RiskBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';

export default function ParentOverview() {
  const [inputId, setInputId] = useState('');
  const [linkedStudentId, setLinkedStudentId] = useState('');
  const { data, isLoading } = useParentDashboard(linkedStudentId);

  const handleLink = () => {
    if (inputId.trim()) setLinkedStudentId(inputId.trim());
  };

  if (!linkedStudentId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
        <span className="text-5xl">👨‍👩‍👧</span>
        <h2 className="text-lg font-semibold text-gray-700">Parent Portal</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Enter your child's Student ID below to view their academic progress, attendance, and AI risk indicators.
        </p>
        <div className="flex gap-2 w-full max-w-sm">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter Student ID (e.g. STU001 or UUID)"
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLink()}
          />
          <button
            onClick={handleLink}
            disabled={!inputId.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            View
          </button>
        </div>
        <p className="text-xs text-gray-400">Contact the college admin if you don't know your child's Student ID.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner message="Loading academic data…" />;

  const attendance: Array<{ subject_code: string; attendance_percentage: string }> = data?.attendance?.data ?? [];
  const results = data?.results?.data;
  const risk = data?.riskScore?.data;
  const semGPA = results?.semesterGPA ?? {};
  const latestSem = Object.keys(semGPA).sort().pop();

  const chartData = attendance.map(a => ({
    subject: a.subject_code,
    attendance: parseFloat(a.attendance_percentage),
  }));

  const avgAtt = attendance.length
    ? (
        attendance.reduce(
          (s: number, a: { attendance_percentage: string }) => s + parseFloat(a.attendance_percentage),
          0
        ) / attendance.length
      ).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Child's Academic Overview"
        subtitle={`Student: ${linkedStudentId}`}
        action={
          <button
            onClick={() => { setLinkedStudentId(''); setInputId(''); }}
            className="text-xs text-indigo-600 hover:underline"
          >
            ← Change student
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Average Attendance" value={`${avgAtt}%`} icon="📋" color="indigo" />
        <StatCard
          title="Current GPA"
          value={latestSem ? semGPA[latestSem] ?? '—' : '—'}
          icon="📚"
          color="green"
        />
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 font-medium mb-2">AI Risk Level</p>
          <RiskBadge risk={risk?.risk_score ?? 'Low'} />
          <p className="text-xs text-gray-400 mt-2">Based on attendance, marks &amp; fees</p>
        </div>
      </div>

      {chartData.length > 0 && <AttendanceChart data={chartData} />}

      {results?.backlogs?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 mb-2">⚠️ Active Backlogs</h3>
          <div className="flex flex-wrap gap-2">
            {results.backlogs.map((b: { subject_code: string; semester: number }, i: number) => (
              <span
                key={i}
                className="bg-red-100 text-red-700 border border-red-200 rounded-full px-3 py-1 text-sm"
              >
                {b.subject_code} (Sem {b.semester})
              </span>
            ))}
          </div>
        </div>
      )}

      {!data && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          ⚠️ No data found for Student ID <strong>{linkedStudentId}</strong>. Please check the ID or contact the admin.
        </div>
      )}
    </div>
  );
}
