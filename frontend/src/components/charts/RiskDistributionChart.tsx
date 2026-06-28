import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface Props { low: number; medium: number; high: number; }

const SLICES = [
  { key: 'Low',    fill: '#22C55E' },
  { key: 'Medium', fill: '#F59E0B' },
  { key: 'High',   fill: '#EF4444' },
];

export default function RiskDistributionChart({ low, medium, high }: Props) {
  const { isDark } = useTheme();

  const tickClr = isDark ? '#94A3B8' : '#64748B';
  const ttStyle = {
    background: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: 8, color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  const data = [
    { name: 'Low Risk',    value: low },
    { name: 'Medium Risk', value: medium },
    { name: 'High Risk',   value: high },
  ];

  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide mb-4"
        style={{ color: 'var(--color-text-faint)' }}>
        Student Risk Distribution
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
            dataKey="value" paddingAngle={3}
            label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
            labelLine={{ stroke: tickClr, strokeWidth: 1 }}>
            {data.map((_, i) => (
              <Cell key={i} fill={SLICES[i].fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={ttStyle} formatter={(v: number, n: string) => [v, n]} />
          <Legend
            formatter={(value) => (
              <span style={{ color: tickClr, fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
