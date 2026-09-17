import { useQuery } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function PlacementOverview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['placement-analytics'],
    queryFn: () => api.get('/placement/analytics').then(r => r.data.data),
  });
  const { isDark } = useTheme();

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: 'var(--color-danger-muted)' }}>⚠️</div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Failed to load placement data. Please refresh the page.
        </p>
      </div>
    );
  }

  const byStatus = data?.byStatus ?? [];
  const COLORS: Record<string, { start: string; end: string }> = {
    placed:     { start: '#10B981', end: '#34D399' },
    not_placed: { start: '#6B7280', end: '#9CA3AF' },
    opted_out:  { start: '#F59E0B', end: '#FBBF24' },
  };

  const pieData = byStatus.map((s: { placement_status: string; count: string }) => ({
    name: s.placement_status.replace('_', ' '),
    value: parseInt(s.count),
    color: COLORS[s.placement_status]?.start ?? '#6366F1',
  }));
  const total = pieData.reduce((s: number, d: { value: number }) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card-glass p-6 relative overflow-hidden animate-fade-in-up">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'var(--gradient-success)', filter: 'blur(50px)' }} />
        <div className="relative">
          <h1 className="text-xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>Placement Overview 🚀</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Campus recruitment analytics and student placement status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="animate-fade-in-up stagger-1">
          <StatCard title="Total Placed" value={data?.totalPlaced ?? '—'} icon="🎓" color="green" />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatCard title="Avg Readiness Score" value={data?.avgReadinessScore ? parseFloat(data.avgReadinessScore).toFixed(1) : '—'} icon="⭐" color="indigo" subtitle="out of 100" />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatCard title="Active Companies" value="—" icon="🏢" color="yellow" />
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="card p-5 animate-fade-in-up stagger-4">
          <h3 className="text-sm font-heading font-bold mb-4" style={{ color: 'var(--color-text-base)' }}>Placement Status Distribution</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {Object.entries(COLORS).map(([key, c]) => (
                      <linearGradient key={key} id={`place${key}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={c.start} />
                        <stop offset="100%" stopColor={c.end} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                    paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
                    strokeWidth={0} animationDuration={800}>
                    {pieData.map((entry: { color: string; name: string }, i: number) => {
                      const key = entry.name.replace(' ', '_');
                      return <Cell key={i} fill={`url(#place${key})`} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                    borderRadius: 12, fontSize: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>{total}</span>
                <span className="text-[10px]" style={{ color: 'var(--color-text-faint)' }}>students</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {pieData.map((item: { name: string; value: number; color: string }, i: number) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium capitalize" style={{ color: 'var(--color-text-muted)' }}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-base)' }}>{item.value}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-elevated)', color: 'var(--color-text-faint)' }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
