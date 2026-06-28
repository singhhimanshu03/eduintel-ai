import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DataPoint { semester: string; gpa: number; }
interface Props { data: DataPoint[]; }

export default function PerformanceTrendChart({ data }: Props) {
  const { isDark } = useTheme();

  const grid    = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const tickClr = isDark ? '#64748B' : '#94A3B8';
  const ttStyle = {
    background: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: 8, color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };
  const gradId = `gpa-grad-${isDark ? 'dark' : 'light'}`;

  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide mb-4"
        style={{ color: 'var(--color-text-faint)' }}>
        GPA Trend by Semester
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366F1" stopOpacity={isDark ? 0.25 : 0.15} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="semester" tick={{ fontSize: 11, fill: tickClr }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: tickClr }} axisLine={false} tickLine={false}
            tickFormatter={v => v.toFixed(1)} />
          <Tooltip contentStyle={ttStyle} formatter={(v: number) => [v.toFixed(2), 'GPA']} />
          <ReferenceLine y={7} stroke={isDark ? '#334155' : '#E2E8F0'} strokeDasharray="4 4"
            label={{ value: '7.0 pass', fill: tickClr, fontSize: 10 }} />
          <Area type="monotone" dataKey="gpa" stroke="#6366F1" strokeWidth={2.5}
            fill={`url(#${gradId})`} dot={{ r: 4, fill: '#6366F1', stroke: 'var(--color-surface)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#6366F1', stroke: 'var(--color-surface)', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
