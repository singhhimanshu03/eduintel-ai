export default function LoadingSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 animate-fade-in">
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full"
          style={{ border: '3px solid var(--color-border)' }} />
        {/* Spinning gradient arc */}
        <div className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '3px solid transparent',
            borderTopColor: 'var(--color-primary)',
            borderRightColor: 'var(--color-primary)',
          }} />
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full"
          style={{ background: 'var(--gradient-primary)', opacity: 0.1 }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
    </div>
  );
}
