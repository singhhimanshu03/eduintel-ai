import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface Props { data: { semester: string; gpa: number }[]; }

export default function PerformanceTrendChart({ data }: Props) {
  const { isDark } = useTheme();
  const grid = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const tick = isDark ? '#64748B' : '#94A3B8';

  return (
    <div className="card p-5">
      <h3 className="text-sm font-heading font-bold mb-5" style={{ color: 'var(--color-text-base)' }}>
        Performance Trend
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="perfGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="semester" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1E293B' : '#FFFFFF',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              borderRadius: 12, fontSize: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
          />
          <Line type="monotone" dataKey="gpa"
            stroke="url(#perfGrad)" strokeWidth={3}
            dot={{ r: 5, fill: '#6366F1', stroke: isDark ? '#1E293B' : '#FFFFFF', strokeWidth: 2.5 }}
            activeDot={{ r: 7, fill: '#6366F1', stroke: isDark ? '#1E293B' : '#FFFFFF', strokeWidth: 2.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
