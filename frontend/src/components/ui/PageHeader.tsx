interface Props { title: string; subtitle?: string; action?: React.ReactNode; }

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-base)]">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
