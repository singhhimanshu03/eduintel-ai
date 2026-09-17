interface Props { title: string; subtitle?: string; action?: React.ReactNode; }

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 pb-4"
      style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div>
        <h2 className="text-xl font-heading font-bold tracking-tight" style={{ color: 'var(--color-text-base)' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
