import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DataPoint { semester: string; gpa: number; }
interface Props { data: DataPoint[]; }

export default function PerformanceTrendChart({ data }: Props) {
  const { isDark } = useTheme();

  const grid    = isDark ? '#ffffff14' : '#f0f0f0';
  const tick    = isDark ? '#9ca3af'   : '#6b7280';
  const tooltip = isDark ? { bg: '#1e1e1e', border: '#ffffff20', text: '#f1f1f1' }
                         : { bg: '#ffffff', border: '#e5e7eb',   text: '#111827' };

  return (
    <div className="card p-4 transition-colors duration-200">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
        GPA Trend by Semester
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="semester" tick={{ fontSize: 11, fill: tick }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: tick }} />
          <Tooltip
            contentStyle={{ background: tooltip.bg, border: `1px solid ${tooltip.border}`, borderRadius: 8, color: tooltip.text }}
          />
          <Legend wrapperStyle={{ color: tick, fontSize: 12 }} />
          <Line type="monotone" dataKey="gpa" stroke="#6366F1" strokeWidth={2}
            dot={{ r: 4, fill: '#6366F1' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
