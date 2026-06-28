import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DataPoint { subject: string; attendance: number; }
interface Props { data: DataPoint[]; threshold?: number; }

export default function AttendanceChart({ data, threshold = 75 }: Props) {
  const { isDark } = useTheme();

  const grid    = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const tickClr = isDark ? '#64748B' : '#94A3B8';
  const ttStyle = {
    background: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: 8, color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  const barColor = (v: number) => v < threshold ? '#EF4444' : '#4F46E5';

  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide mb-4"
        style={{ color: 'var(--color-text-faint)' }}>
        Subject-wise Attendance (%)
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="subject" tick={{ fontSize: 11, fill: tickClr }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickClr }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v}%`, 'Attendance']} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
          <ReferenceLine y={threshold} stroke="#EF4444" strokeDasharray="5 3" strokeWidth={1.5}
            label={{ value: `${threshold}% min`, fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }} />
          <Bar dataKey="attendance" radius={[4, 4, 0, 0]}
            label={{ position: 'top', fontSize: 10, fill: tickClr, formatter: (v: number) => `${v}%` }}>
            {data.map((d, i) => <Cell key={i} fill={barColor(d.attendance)} fillOpacity={0.9} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
