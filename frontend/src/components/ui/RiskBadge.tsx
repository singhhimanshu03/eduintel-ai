interface Props { risk: string; size?: 'sm' | 'md'; }

const config: Record<string, { cls: string; dot: string; pulse?: boolean }> = {
  Low:    { cls: 'badge-success', dot: 'var(--color-success)' },
  Medium: { cls: 'badge-warning', dot: 'var(--color-warning)' },
  High:   { cls: 'badge-danger',  dot: 'var(--color-danger)', pulse: true },
};

export default function RiskBadge({ risk, size = 'sm' }: Props) {
  const c = config[risk] ?? { cls: 'badge-neutral', dot: 'var(--color-text-faint)' };
  return (
    <span className={`badge ${c.cls} ${size === 'md' ? 'text-xs px-3 py-1' : ''} gap-1.5`}>
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.pulse ? 'animate-pulse-dot' : ''}`}
        style={{ backgroundColor: c.dot }}
      />
      {risk}
    </span>
  );
}
