import { useQuery } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PlacementOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['placement-analytics'],
    queryFn: () => api.get('/placement/analytics').then(r => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const byStatus = data?.byStatus ?? [];
  const COLORS: Record<string, string> = { placed: '#10B981', not_placed: '#6B7280', opted_out: '#F59E0B' };

  const pieData = byStatus.map((s: { placement_status: string; count: string }) => ({
    name: s.placement_status.replace('_', ' '),
    value: parseInt(s.count),
    fill: COLORS[s.placement_status] ?? '#4F46E5',
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Placement Overview" subtitle="Campus recruitment analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Placed" value={data?.totalPlaced ?? '—'} icon="🎓" color="green" />
        <StatCard title="Avg Readiness Score" value={data?.avgReadinessScore ? parseFloat(data.avgReadinessScore).toFixed(1) : '—'} icon="⭐" color="indigo" subtitle="out of 100" />
        <StatCard title="Active Companies" value="—" icon="🏢" color="yellow" />
      </div>

      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Placement Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((entry: { fill: string }, i: number) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
