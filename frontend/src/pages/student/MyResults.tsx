import { useAuth } from '../../hooks/useAuth';
import { useStudentResults } from '../../hooks/useExams';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PerformanceTrendChart from '../../components/charts/PerformanceTrendChart';

interface Mark {
  semester: number; subject_code: string; subject_name?: string;
  internal_marks: number; semester_marks: number;
  total_marks: number; grade: string; gpa_points: number; is_backlog: boolean;
}

const gradeColor = (g: string) => {
  if (g === 'O')                     return { color: '#22C55E' };
  if (g === 'A+' || g === 'A')       return { color: '#6366F1' };
  if (g === 'B+' || g === 'B')       return { color: '#F59E0B' };
  if (g === 'F')                     return { color: '#EF4444' };
  return { color: 'var(--color-text-muted)' };
};

export default function MyResults() {
  const { userId } = useAuth();
  const { data, isLoading } = useStudentResults(userId ?? '');

  if (isLoading) return <LoadingSpinner />;

  const marks: Mark[]  = data?.marks ?? [];
  const semGPA: Record<string, number> = data?.semesterGPA ?? {};
  const backlogs: Mark[] = data?.backlogs ?? [];

  const trendData = Object.entries(semGPA)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([sem, gpa]) => ({ semester: `Sem ${sem}`, gpa }));

  const semesters = [...new Set(marks.map(m => m.semester))].sort();

  // CGPA
  const gpaValues = Object.values(semGPA);
  const cgpa = gpaValues.length
    ? (gpaValues.reduce((a, b) => a + b, 0) / gpaValues.length).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="My Results" subtitle="Semester-wise academic performance" />

      {/* CGPA + backlog summary strip */}
      {(cgpa || backlogs.length > 0) && (
        <div className="card p-4 flex flex-wrap gap-4 items-center">
          {cgpa && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                GPA
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
                  Cumulative GPA
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{cgpa}</p>
              </div>
            </div>
          )}

          {backlogs.length > 0 && (
            <>
              <div className="w-px h-8 hidden sm:block" style={{ backgroundColor: 'var(--color-border)' }} />
              <div>
                <p className="text-2xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-faint)' }}>
                  Active Backlogs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {backlogs.map((b, i) => (
                    <span key={i} className="badge badge-danger text-2xs">
                      {b.subject_code} · Sem {b.semester}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* GPA trend chart */}
      {trendData.length > 0 && <PerformanceTrendChart data={trendData} />}

      {/* Per-semester tables */}
      {semesters.map(sem => {
        const semMarks = marks.filter(m => m.semester === sem);
        const gpa = semGPA[sem];
        const passed = semMarks.filter(m => !m.is_backlog).length;
        const total  = semMarks.length;

        return (
          <div key={sem} className="card overflow-hidden">
            {/* Semester header */}
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ backgroundColor: 'var(--color-elevated)', borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {sem}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
                    Semester {sem}
                  </p>
                  <p className="text-2xs" style={{ color: 'var(--color-text-faint)' }}>
                    {passed}/{total} subjects passed
                  </p>
                </div>
              </div>
              {gpa !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-2xs uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
                    GPA
                  </span>
                  <span
                    className="text-base font-bold px-2.5 py-0.5 rounded-lg"
                    style={{
                      backgroundColor: gpa >= 8 ? 'var(--color-success-muted)' :
                                       gpa >= 6 ? 'var(--color-warning-muted)' : 'var(--color-danger-muted)',
                      color: gpa >= 8 ? 'var(--color-success)' :
                             gpa >= 6 ? 'var(--color-warning)' : 'var(--color-danger)',
                    }}
                  >
                    {gpa.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Marks table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Subject', 'Internal', 'Semester', 'Total', 'Grade', 'GPA Pts', 'Result'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-semibold uppercase tracking-wider"
                        style={{ fontSize: '0.625rem', color: 'var(--color-text-faint)', backgroundColor: 'var(--color-surface)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {semMarks.map((m, i) => (
                    <tr key={i}
                      style={{
                        backgroundColor: m.is_backlog
                          ? 'var(--color-danger-muted)'
                          : i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-elevated)',
                        borderBottom: '1px solid var(--color-border)',
                      }}>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--color-text-base)' }}>
                            {m.subject_code}
                          </p>
                          {m.subject_name && (
                            <p className="text-2xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                              {m.subject_name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--color-text-muted)' }}>
                        {m.internal_marks}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--color-text-muted)' }}>
                        {m.semester_marks}
                      </td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--color-text-base)' }}>
                        {m.total_marks}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-base font-bold" style={gradeColor(m.grade)}>
                          {m.grade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {m.gpa_points}
                      </td>
                      <td className="px-5 py-3.5">
                        {m.is_backlog
                          ? <span className="badge badge-danger">FAIL</span>
                          : <span className="badge badge-success">PASS</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {marks.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-3 opacity-40">📚</div>
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>No results published yet.</p>
        </div>
      )}
    </div>
  );
}
