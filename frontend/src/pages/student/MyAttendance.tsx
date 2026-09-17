import { useAuth } from '../../hooks/useAuth';
import { useStudentAttendance } from '../../hooks/useAttendance';
import PageHeader from '../../components/ui/PageHeader';
import AttendanceChart from '../../components/charts/AttendanceChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface AttRow {
  subject_code: string; semester: number;
  total_classes: number; attended_classes: number; attendance_percentage: string;
}

export default function MyAttendance() {
  const { userId } = useAuth();
  const { data = [], isLoading } = useStudentAttendance(userId ?? '');

  const handleDownloadPDF = () => {
    window.open(`/api/attendance/students/${userId}/pdf`, '_blank');
  };

  const chartData = (data as AttRow[]) as unknown as Array<{ subject_code: string; total_present: number; total_absent: number }>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        subtitle="Subject-wise attendance breakdown"
        action={
          <button onClick={handleDownloadPDF} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF
          </button>
        }
      />

      {isLoading ? <LoadingSpinner /> : (
        <>
          {chartData.length > 0 && (
            <div className="animate-fade-in-up">
              <AttendanceChart data={chartData} />
            </div>
          )}
          <div className="card overflow-hidden animate-fade-in-up stagger-2">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-elevated)' }}>
                    {['Subject', 'Semester', 'Classes Held', 'Attended', 'Absent', 'Attendance %', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-faint)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data as AttRow[]).map((row, i) => {
                    const pct = parseFloat(row.attendance_percentage);
                    const ok = pct >= 75;
                    return (
                      <tr key={i} className="transition-colors duration-100 hover:bg-[var(--color-primary-muted)]"
                        style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-base)' }}>{row.subject_code}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{row.semester}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{row.total_classes}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-success)' }}>{row.attended_classes}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-danger)' }}>{row.total_classes - row.attended_classes}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-text-base)' }}>{pct.toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${ok ? 'badge-success' : 'badge-danger'}`}>
                            {ok ? '✓ Eligible' : '✗ At Risk'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
