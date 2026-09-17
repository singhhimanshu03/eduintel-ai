import { useParams, useNavigate } from 'react-router-dom';
import { useStudent, useStudentAcademicHistory } from '../../hooks/useStudents';
import { useStudentAttendance } from '../../hooks/useAttendance';
import { useStudentRecommendations } from '../../hooks/useAI';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskBadge from '../../components/ui/RiskBadge';
import AttendanceChart from '../../components/charts/AttendanceChart';

export default function StudentDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(id);
  const { data: history = [] } = useStudentAcademicHistory(id);
  const { data: attendance = [] } = useStudentAttendance(id);

  const recPayload = student ? {
    student_id: id,
    attendance_percentage: attendance[0]?.attendance_percentage ?? 75,
    avg_internal_marks: 60,
    prev_semester_gpa: history[0]?.gpa ?? 7,
    current_gpa: history[0]?.gpa ?? 7,
    fee_status: 'paid',
    backlog_count: (history as Array<{ is_backlog: boolean }>).filter(h => h.is_backlog).length,
    internal_marks: [60, 65, 70],
  } : {};
  const { data: recs } = useStudentRecommendations(id, recPayload);

  if (isLoading) return <LoadingSpinner />;
  if (!student) return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ backgroundColor: 'var(--color-elevated)' }}>🔍</div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Student not found.</p>
    </div>
  );

  const chartData = attendance as Array<{ subject_code: string; total_present: number; total_absent: number }>;

  const initials = (student.full_name ?? '').split(' ').map((w: string) => w[0]?.toUpperCase()).join('').slice(0, 2);

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.full_name}
        subtitle={`ID: ${student.student_code} | Semester ${student.current_semester}`}
        action={
          <button onClick={() => navigate('/admin/students')} className="btn-ghost text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to list
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Profile card */}
        <div className="card p-6 space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
              {initials}
            </div>
            <div>
              <h3 className="text-base font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
                {student.full_name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{student.student_code}</p>
            </div>
            <span className={`badge ml-auto ${student.enrollment_status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
              {student.enrollment_status}
            </span>
          </div>
          <hr className="divider" />
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Email', student.email],
              ['Phone', student.phone ?? '—'],
              ['Enrolled', student.enrollment_date?.split('T')[0] ?? '—'],
              ['Semester', student.current_semester],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>{label}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text-base)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        {recs && (
          <div className="card-glass p-6 animate-fade-in-up stagger-1 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-15 pointer-events-none"
              style={{ background: 'var(--gradient-primary)', filter: 'blur(40px)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                  style={{ background: 'var(--gradient-primary)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25" />
                  </svg>
                </div>
                <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>AI Recommendations</h3>
                <RiskBadge risk={recs.overall_risk ?? 'Low'} size="md" />
              </div>
              <ul className="space-y-2.5">
                {(recs.improvement_plan ?? []).map((step: string, i: number) => (
                  <li key={i} className="flex gap-2.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: 'var(--gradient-primary)' }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Attendance chart */}
      {chartData.length > 0 && (
        <div className="animate-fade-in-up stagger-2">
          <AttendanceChart data={chartData as Array<{ subject_code: string; total_present: number; total_absent: number }>} />
        </div>
      )}

      {/* Academic history */}
      <div className="card overflow-hidden animate-fade-in-up stagger-3">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>Academic History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-elevated)' }}>
                {['Sem', 'Subject', 'Internal', 'Semester', 'Total', 'Grade', 'GPA', 'Backlog'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-faint)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(history as Array<{
                semester: number; subject_code: string; internal_marks: number;
                semester_marks: number; total_marks: number; grade: string; gpa: number; is_backlog: boolean;
              }>).map((r, i) => (
                <tr key={i} className="transition-colors duration-100 hover:bg-[var(--color-primary-muted)]"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{r.semester}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-base)' }}>{r.subject_code}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{r.internal_marks}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{r.semester_marks}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text-base)' }}>{r.total_marks}</td>
                  <td className="px-4 py-3"><span className="badge badge-primary">{r.grade}</span></td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{r.gpa}</td>
                  <td className="px-4 py-3">
                    {r.is_backlog
                      ? <span className="badge badge-danger">Yes</span>
                      : <span className="badge badge-success">No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
