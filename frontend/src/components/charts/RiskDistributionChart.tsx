import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface Props { low: number; medium: number; high: number; }
const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function RiskDistributionChart({ low, medium, high }: Props) {
  const { isDark } = useTheme();

  const tooltip = isDark ? { bg: '#1e1e1e', border: '#ffffff20', text: '#f1f1f1' }
                         : { bg: '#ffffff', border: '#e5e7eb',   text: '#111827' };
  const tick    = isDark ? '#9ca3af' : '#6b7280';

  const data = [
    { name: 'Low Risk',    value: low    },
    { name: 'Medium Risk', value: medium },
    { name: 'High Risk',   value: high   },
  ];

  return (
    <div className="card p-4 transition-colors duration-200">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Student Risk Distribution
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={{ stroke: tick }}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: tooltip.bg, border: `1px solid ${tooltip.border}`, borderRadius: 8, color: tooltip.text }}
          />
          <Legend wrapperStyle={{ color: tick, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
