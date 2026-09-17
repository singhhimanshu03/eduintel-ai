import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface Props { data: { date: string; daily_collection: number }[]; }

export default function FeeCollectionChart({ data }: Props) {
  const { isDark } = useTheme();
  const grid = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const tick = isDark ? '#64748B' : '#94A3B8';

  return (
    <div className="card p-5">
      <h3 className="text-sm font-heading font-bold mb-5" style={{ color: 'var(--color-text-base)' }}>
        Fee Collection Trend
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="date"
            tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1E293B' : '#FFFFFF',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              borderRadius: 12, fontSize: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
            formatter={(v: number) => [`₹${Number(v).toLocaleString()}`, 'Collected']}
          />
          <Area type="monotone" dataKey="daily_collection"
            stroke="#10B981" strokeWidth={2.5}
            fill="url(#feeGrad)"
            dot={{ r: 3, fill: '#10B981', stroke: isDark ? '#1E293B' : '#FFFFFF', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#10B981', stroke: isDark ? '#1E293B' : '#FFFFFF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

