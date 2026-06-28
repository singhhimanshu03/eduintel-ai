import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DataPoint { date: string; daily_collection: number; }
interface Props { data: DataPoint[]; }

export default function FeeCollectionChart({ data }: Props) {
  const { isDark } = useTheme();

  const grid    = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const tickClr = isDark ? '#64748B' : '#94A3B8';
  const ttStyle = {
    background: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: 8, color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide mb-4"
        style={{ color: 'var(--color-text-faint)' }}>
        Daily Fee Collection — Last 30 Days
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="fee-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22C55E" stopOpacity={isDark ? 0.3 : 0.2} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickClr }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tickClr }} axisLine={false} tickLine={false}
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip contentStyle={ttStyle}
            formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Collected']} />
          <Area type="monotone" dataKey="daily_collection" stroke="#22C55E" strokeWidth={2.5}
            fill="url(#fee-grad)"
            dot={false} activeDot={{ r: 5, fill: '#22C55E', stroke: 'var(--color-surface)', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
