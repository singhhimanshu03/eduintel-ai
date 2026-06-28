import { useParams } from 'react-router-dom';
import { useStudent, useStudentAcademicHistory } from '../../hooks/useStudents';
import { useStudentAttendance } from '../../hooks/useAttendance';
import { useStudentRecommendations } from '../../hooks/useAI';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskBadge from '../../components/ui/RiskBadge';
import AttendanceChart from '../../components/charts/AttendanceChart';

export default function StudentDetail() {
  const { id = '' } = useParams();
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
  if (!student) return <p className="text-gray-500">Student not found.</p>;

  const chartData = (attendance as Array<{ subject_code: string; attendance_percentage: string }>)
    .map(a => ({ subject: a.subject_code, attendance: parseFloat(a.attendance_percentage) }));

  return (
    <div className="space-y-6">
      <PageHeader title={student.full_name} subtitle={`ID: ${student.student_code} | Semester ${student.current_semester}`} />

      {/* Profile card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-700">Profile</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Email', student.email],
              ['Phone', student.phone ?? '—'],
              ['Enrollment', student.enrollment_status],
              ['Enrolled', student.enrollment_date?.split('T')[0] ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        {recs && (
          <div className="bg-white rounded-xl border border-indigo-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span>🤖</span>
              <h3 className="font-semibold text-gray-700">AI Recommendations</h3>
              <RiskBadge risk={recs.overall_risk ?? 'Low'} />
            </div>
            <ul className="space-y-1.5">
              {(recs.improvement_plan ?? []).map((step: string, i: number) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-indigo-500 font-bold">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Attendance chart */}
      {chartData.length > 0 && <AttendanceChart data={chartData} />}

      {/* Academic history */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Academic History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-xs text-gray-500 border-b">
              {['Sem', 'Subject', 'Internal', 'Semester', 'Total', 'Grade', 'GPA', 'Backlog'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(history as Array<{
                semester: number; subject_code: string; internal_marks: number;
                semester_marks: number; total_marks: number; grade: string; gpa: number; is_backlog: boolean;
              }>).map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2">{r.semester}</td>
                  <td className="px-3 py-2 font-medium">{r.subject_code}</td>
                  <td className="px-3 py-2">{r.internal_marks}</td>
                  <td className="px-3 py-2">{r.semester_marks}</td>
                  <td className="px-3 py-2">{r.total_marks}</td>
                  <td className="px-3 py-2 font-semibold">{r.grade}</td>
                  <td className="px-3 py-2">{r.gpa}</td>
                  <td className="px-3 py-2">
                    {r.is_backlog ? <span className="text-red-600 font-bold">Yes</span> : <span className="text-green-600">No</span>}
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
