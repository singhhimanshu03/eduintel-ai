import { useAuth } from '../../hooks/useAuth';
import { useStudentDashboard } from '../../hooks/useDashboard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AttendanceChart from '../../components/charts/AttendanceChart';
import RiskBadge from '../../components/ui/RiskBadge';
import PageHeader from '../../components/ui/PageHeader';

export default function StudentOverview() {
  const { userId } = useAuth();
  const { data, isLoading } = useStudentDashboard(userId ?? '');

  if (isLoading) return <LoadingSpinner />;

  const attendance: Array<{ subject_code: string; attendance_percentage: string }> = data?.attendance?.data ?? [];
  const recs = data?.recommendations;
  const results = data?.results?.data;

  const chartData = attendance.map(a => ({
    subject: a.subject_code, attendance: parseFloat(a.attendance_percentage),
  }));

  const semGPA = results?.semesterGPA ?? {};
  const latestSem = Object.keys(semGPA).sort().pop();
  const currentGPA = latestSem ? semGPA[latestSem] : null;

  return (
    <div className="space-y-6">
      <PageHeader title="My Dashboard" subtitle="Your academic snapshot" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4
          bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Current GPA</p>
          <p className="text-3xl font-bold text-indigo-800 dark:text-indigo-200 mt-1">{currentGPA ?? '—'}</p>
        </div>
        <div className="rounded-xl border p-4
          bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Avg Attendance</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200 mt-1">
            {attendance.length ? (attendance.reduce((s, a) => s + parseFloat(a.attendance_percentage), 0) / attendance.length).toFixed(1) + '%' : '—'}
          </p>
        </div>
        <div className="rounded-xl border p-4
          bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/40">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Backlogs</p>
          <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200 mt-1">{results?.backlogs?.length ?? 0}</p>
        </div>
        <div className="card p-4 transition-colors duration-200">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Risk Level</p>
          <div className="mt-2">
            <RiskBadge risk={recs?.overall_risk ?? 'Low'} />
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      {chartData.length > 0 && <AttendanceChart data={chartData} />}

      {/* AI Recommendations */}
      {recs && (
        <div className="card border-indigo-200 dark:border-indigo-700/40 p-5 transition-colors duration-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="font-semibold text-gray-800 dark:text-white">AI Improvement Plan</h3>
            <RiskBadge risk={recs.overall_risk ?? 'Low'} />
          </div>
          <ul className="space-y-2">
            {(recs.improvement_plan ?? []).map((step: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm rounded-lg px-3 py-2
                text-gray-700 dark:text-gray-300
                bg-indigo-50 dark:bg-indigo-900/20">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
          {(recs.subjects_needing_attention ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">⚠️ Subjects needing attention:</p>
              <div className="flex flex-wrap gap-2">
                {recs.subjects_needing_attention.map((s: string) => (
                  <span key={s} className="text-xs px-2 py-1 rounded-full
                    bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40
                    text-red-700 dark:text-red-300">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
