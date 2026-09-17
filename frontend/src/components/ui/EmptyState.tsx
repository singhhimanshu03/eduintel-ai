interface Props {
  icon?: string;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description = 'There are no records to display.',
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-5"
        style={{ backgroundColor: 'var(--color-elevated)' }}>
        {icon}
      </div>
      <h3 className="text-base font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
        {title}
      </h3>
      <p className="text-sm mt-1.5 text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
        {description}
      </p>
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-5 text-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}
