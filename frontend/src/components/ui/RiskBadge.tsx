interface Props { risk: string; size?: 'sm' | 'md'; }

const map: Record<string, string> = {
  Low:    'badge badge-success',
  Medium: 'badge badge-warning',
  High:   'badge badge-danger',
};

const dotColor: Record<string, string> = {
  Low:    'bg-[var(--color-success)]',
  Medium: 'bg-[var(--color-warning)]',
  High:   'bg-[var(--color-danger)]',
};

export default function RiskBadge({ risk, size = 'sm' }: Props) {
  const cls = map[risk] ?? 'badge badge-neutral';
  const dot = dotColor[risk];
  return (
    <span className={`${cls} ${size === 'md' ? 'text-xs px-2.5 py-1' : ''} gap-1.5`}>
      {dot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />}
      {risk}
    </span>
  );
}
