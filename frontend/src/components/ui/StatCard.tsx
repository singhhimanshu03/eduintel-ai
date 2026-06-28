interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'indigo' | 'green' | 'yellow' | 'red';
  subtitle?: string;
  trend?: { value: string; up: boolean };
}

const colorTokens = {
  indigo: {
    bg:    'bg-[var(--color-primary-muted)]',
    icon:  'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300',
    value: 'text-[var(--color-primary)]',
  },
  green: {
    bg:    'bg-[var(--color-success-muted)]',
    icon:  'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300',
    value: 'text-[var(--color-success)]',
  },
  yellow: {
    bg:    'bg-[var(--color-warning-muted)]',
    icon:  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-300',
    value: 'text-[var(--color-warning)]',
  },
  red: {
    bg:    'bg-[var(--color-danger-muted)]',
    icon:  'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
    value: 'text-[var(--color-danger)]',
  },
};

export default function StatCard({ title, value, icon, color = 'indigo', subtitle, trend }: StatCardProps) {
  const t = colorTokens[color];
  return (
    <div className="card group relative overflow-hidden
      hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-150 p-5">
      {/* Subtle tinted background accent */}
      <div className={`absolute inset-0 ${t.bg} opacity-40 pointer-events-none`} />

      <div className="relative flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${t.icon}`}>
          {icon}
        </div>

        {/* Trend badge */}
        {trend && (
          <span className={`badge text-2xs flex-shrink-0 ${trend.up ? 'badge-success' : 'badge-danger'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div className="relative mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 tracking-tight ${t.value}`}>{value}</p>
        {subtitle && <p className="text-xs text-[var(--color-text-faint)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
