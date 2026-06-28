export default function LoadingSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border)]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent
          border-t-[var(--color-primary)] animate-spin" />
      </div>
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{message}</p>
    </div>
  );
}
