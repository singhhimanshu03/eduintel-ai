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
    const token = JSON.parse(localStorage.getItem('auth') || '{}').accessToken;
    window.open(`/api/attendance/students/${userId}/pdf`, '_blank');
  };

  const chartData = (data as AttRow[]).map(a => ({
    subject: `${a.subject_code}(${a.semester})`,
    attendance: parseFloat(a.attendance_percentage),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        subtitle="Subject-wise attendance breakdown"
        action={
          <button onClick={handleDownloadPDF}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            📄 Download PDF
          </button>
        }
      />

      {isLoading ? <LoadingSpinner /> : (
        <>
          {chartData.length > 0 && <AttendanceChart data={chartData} />}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Subject', 'Semester', 'Classes Held', 'Attended', 'Absent', 'Attendance %', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data as AttRow[]).map((row, i) => {
                  const pct = parseFloat(row.attendance_percentage);
                  const ok = pct >= 75;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{row.subject_code}</td>
                      <td className="px-4 py-3">{row.semester}</td>
                      <td className="px-4 py-3">{row.total_classes}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">{row.attended_classes}</td>
                      <td className="px-4 py-3 text-red-600">{row.total_classes - row.attended_classes}</td>
                      <td className="px-4 py-3 font-bold">{pct.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {ok ? '✓ Eligible' : '✗ At Risk'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
