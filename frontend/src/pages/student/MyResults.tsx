import { useAuth } from '../../hooks/useAuth';
import { useStudentResults } from '../../hooks/useExams';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PerformanceTrendChart from '../../components/charts/PerformanceTrendChart';

interface Mark {
  semester: number; subject_code: string;
  internal_marks: number; semester_marks: number;
  total_marks: number; grade: string; gpa_points: number; is_backlog: boolean;
}

export default function MyResults() {
  const { userId } = useAuth();
  const { data, isLoading } = useStudentResults(userId ?? '');

  if (isLoading) return <LoadingSpinner />;

  const marks: Mark[] = data?.marks ?? [];
  const semGPA: Record<string, number> = data?.semesterGPA ?? {};
  const backlogs: Mark[] = data?.backlogs ?? [];

  const trendData = Object.entries(semGPA)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([sem, gpa]) => ({ semester: `Sem ${sem}`, gpa }));

  const semesters = [...new Set(marks.map(m => m.semester))].sort();

  return (
    <div className="space-y-6">
      <PageHeader title="My Results" subtitle="Semester-wise academic performance" />

      {trendData.length > 0 && <PerformanceTrendChart data={trendData} />}

      {backlogs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 mb-2">⚠️ Current Backlogs ({backlogs.length})</h3>
          <div className="flex flex-wrap gap-2">
            {backlogs.map((b, i) => (
              <span key={i} className="bg-red-100 text-red-700 border border-red-200 rounded-full px-3 py-1 text-sm">
                {b.subject_code} (Sem {b.semester})
              </span>
            ))}
          </div>
        </div>
      )}

      {semesters.map(sem => {
        const semMarks = marks.filter(m => m.semester === sem);
        const gpa = semGPA[sem];
        return (
          <div key={sem} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-200 flex justify-between items-center">
              <h3 className="font-semibold text-indigo-800">Semester {sem}</h3>
              <span className="text-sm font-bold text-indigo-700">GPA: {gpa?.toFixed(2) ?? '—'}</span>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Subject', 'Internal', 'Semester', 'Total', 'Grade', 'GPA Pts', 'Backlog'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {semMarks.map((m, i) => (
                  <tr key={i} className={m.is_backlog ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2 font-medium">{m.subject_code}</td>
                    <td className="px-4 py-2">{m.internal_marks}</td>
                    <td className="px-4 py-2">{m.semester_marks}</td>
                    <td className="px-4 py-2 font-semibold">{m.total_marks}</td>
                    <td className="px-4 py-2 font-bold text-indigo-700">{m.grade}</td>
                    <td className="px-4 py-2">{m.gpa_points}</td>
                    <td className="px-4 py-2">
                      {m.is_backlog
                        ? <span className="text-red-600 font-bold text-xs">FAIL</span>
                        : <span className="text-green-600 text-xs">PASS</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {marks.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No results published yet.</p>
      )}
    </div>
  );
}
