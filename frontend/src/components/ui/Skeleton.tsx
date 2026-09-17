interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'table-row';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

function SkeletonLine({ width, height = '0.875rem', className = '' }: { width?: string; height?: string; className?: string }) {
  return (
    <div className={`skeleton ${className}`}
      style={{ width: width ?? '100%', height, minHeight: height }} />
  );
}

export default function Skeleton({ variant = 'text', width, height, count = 1, className = '' }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <div className={`skeleton rounded-full ${className}`}
        style={{ width: width ?? '2.5rem', height: height ?? '2.5rem' }} />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`card p-5 space-y-4 ${className}`}>
        <SkeletonLine width="40%" height="0.75rem" />
        <SkeletonLine width="70%" height="1.5rem" />
        <SkeletonLine width="55%" height="0.75rem" />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <SkeletonLine width="2rem" height="2rem" className="rounded-full flex-shrink-0" />
            <SkeletonLine width="30%" height="0.75rem" />
            <SkeletonLine width="20%" height="0.75rem" />
            <SkeletonLine width="15%" height="0.75rem" />
          </div>
        ))}
      </div>
    );
  }

  // Default: text lines
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine key={i} width={i === count - 1 ? '60%' : width} height={height} />
      ))}
    </div>
  );
}
