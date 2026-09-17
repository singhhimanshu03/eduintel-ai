import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface Props { low: number; medium: number; high: number; }

const GRADIENT_COLORS = {
  Low:    { start: '#10B981', end: '#34D399' },
  Medium: { start: '#F59E0B', end: '#FBBF24' },
  High:   { start: '#EF4444', end: '#F87171' },
};

export default function RiskDistributionChart({ low, medium, high }: Props) {
  const { isDark } = useTheme();
  const data = [
    { name: 'Low Risk',    value: low    || 0 },
    { name: 'Medium Risk', value: medium || 0 },
    { name: 'High Risk',   value: high   || 0 },
  ];
  const total = low + medium + high;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-heading font-bold mb-3" style={{ color: 'var(--color-text-base)' }}>
        AI Risk Distribution
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut chart with center label */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {Object.entries(GRADIENT_COLORS).map(([key, c]) => (
                  <linearGradient key={key} id={`risk${key}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={c.start} />
                    <stop offset="100%" stopColor={c.end} />
                  </linearGradient>
                ))}
              </defs>
              <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
                strokeWidth={0} animationDuration={800} animationEasing="ease-out">
                <Cell fill="url(#riskLow)" />
                <Cell fill="url(#riskMedium)" />
                <Cell fill="url(#riskHigh)" />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                  borderRadius: 12, fontSize: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>{total}</span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>students</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3 flex-1">
          {data.map((item, i) => {
            const colors = ['#10B981', '#F59E0B', '#EF4444'];
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-base)' }}>{item.value}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-elevated)', color: 'var(--color-text-faint)' }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
