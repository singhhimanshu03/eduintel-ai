import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DataPoint { subject: string; attendance: number; }
interface Props { data: DataPoint[]; threshold?: number; }

export default function AttendanceChart({ data, threshold = 75 }: Props) {
  const { isDark } = useTheme();

  const grid    = isDark ? '#ffffff14' : '#f0f0f0';
  const tick    = isDark ? '#9ca3af'   : '#6b7280';
  const tooltip = isDark ? { bg: '#1e1e1e', border: '#ffffff20', text: '#f1f1f1' }
                         : { bg: '#ffffff', border: '#e5e7eb',   text: '#111827' };

  return (
    <div className="card p-4 transition-colors duration-200">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Subject-wise Attendance (%)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="subject" tick={{ fontSize: 11, fill: tick }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tick }} />
          <Tooltip
            contentStyle={{ background: tooltip.bg, border: `1px solid ${tooltip.border}`, borderRadius: 8, color: tooltip.text }}
            formatter={(v: number) => [`${v}%`, 'Attendance']}
          />
          <ReferenceLine y={threshold} stroke="#EF4444" strokeDasharray="4 4"
            label={{ value: `${threshold}%`, fill: '#EF4444', fontSize: 11 }} />
          <Bar dataKey="attendance" fill="#4F46E5" radius={[4, 4, 0, 0]}
            label={{ position: 'top', fontSize: 10, fill: tick, formatter: (v: number) => `${v}%` }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
