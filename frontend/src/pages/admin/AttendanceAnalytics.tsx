import { useAttendanceAnalytics } from '../../hooks/useAttendance';
import PageHeader from '../../components/ui/PageHeader';
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-5 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Average Attendance</p>
          <p className="text-3xl font-bold text-indigo-800 dark:text-indigo-200 mt-1">{avgAtt}%</p>
        </div>
        <div className="rounded-xl border p-5 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Below Threshold</p>
          <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{below.length}</p>
          <p className="text-xs text-red-500 dark:text-red-400">students</p>
        </div>
        <div className="rounded-xl border p-5 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/40">
          <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Subjects Tracked</p>
          <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200 mt-1">{subjects.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 transition-colors duration-200">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">⬇️ Lowest Performing Subjects</h3>
          <div className="space-y-2">
            {subjects.map((s: { subject_code: string; avg_att: string }, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5
                border-b border-gray-100 dark:border-white/5 last:border-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.subject_code}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${parseFloat(s.avg_att)}%` }} />
                  </div>
                  <span className="text-sm text-red-600 dark:text-red-400 font-semibold w-12 text-right">
                    {parseFloat(s.avg_att).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 transition-colors duration-200">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">⚠️ Students Below Threshold</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {below.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">All students are above threshold 🎉</p>
            ) : below.map((s: { student_id: string; subject_code: string; attendance_percentage: number }, i: number) => (
              <div key={i} className="flex justify-between py-1.5
                border-b border-gray-100 dark:border-white/5 last:border-0 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {s.student_id} — <span className="text-gray-500 dark:text-gray-400">{s.subject_code}</span>
                </span>
                <span className="text-red-600 dark:text-red-400 font-semibold">{s.attendance_percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
