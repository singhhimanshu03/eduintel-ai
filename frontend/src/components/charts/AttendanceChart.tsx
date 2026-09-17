import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface Props { data: { subject_code: string; total_present: number; total_absent: number }[]; }

export default function AttendanceChart({ data }: Props) {
  const { isDark } = useTheme();
  const grid = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const tick = isDark ? '#64748B' : '#94A3B8';

  return (
    <div className="card p-5">
      <h3 className="text-sm font-heading font-bold mb-5" style={{ color: 'var(--color-text-base)' }}>
        Subject-wise Attendance
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="subject_code" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1E293B' : '#FFFFFF',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              borderRadius: 12, fontSize: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', radius: 6 }}
          />
          <defs>
            <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#FCA5A5" />
            </linearGradient>
          </defs>
          <Bar dataKey="total_present" fill="url(#gradPresent)" name="Present" radius={[6, 6, 0, 0]} />
          <Bar dataKey="total_absent"  fill="url(#gradAbsent)"  name="Absent"  radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
