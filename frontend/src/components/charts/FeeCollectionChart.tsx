import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DataPoint { date: string; daily_collection: number; }
interface Props { data: DataPoint[]; }

export default function FeeCollectionChart({ data }: Props) {
  const { isDark } = useTheme();

  const grid    = isDark ? '#ffffff14' : '#f0f0f0';
  const tick    = isDark ? '#9ca3af'   : '#6b7280';
  const tooltip = isDark ? { bg: '#1e1e1e', border: '#ffffff20', text: '#f1f1f1' }
                         : { bg: '#ffffff', border: '#e5e7eb',   text: '#111827' };
  const gradId  = isDark ? 'feeGradDark' : 'feeGradLight';

  return (
    <div className="card p-4 transition-colors duration-200">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Daily Fee Collection (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4F46E5" stopOpacity={isDark ? 0.4 : 0.3} />
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: tick }} />
          <YAxis tick={{ fontSize: 11, fill: tick }} />
          <Tooltip
            contentStyle={{ background: tooltip.bg, border: `1px solid ${tooltip.border}`, borderRadius: 8, color: tooltip.text }}
            formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Collected']}
          />
          <Area type="monotone" dataKey="daily_collection"
            stroke="#4F46E5" fill={`url(#${gradId})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
