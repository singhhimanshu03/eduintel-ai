import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}
interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let toastId = 0;

/* ── Icon per type ──────────────────────────────────────────────────────── */
const ICONS: Record<ToastType, { emoji: string; color: string; bg: string }> = {
  success: { emoji: '✓', color: 'var(--color-success)', bg: 'var(--color-success-muted)' },
  error:   { emoji: '✕', color: 'var(--color-danger)',  bg: 'var(--color-danger-muted)' },
  warning: { emoji: '!', color: 'var(--color-warning)', bg: 'var(--color-warning-muted)' },
  info:    { emoji: 'i', color: 'var(--color-info)',     bg: 'var(--color-info-muted)' },
};

/* ── Single Toast ───────────────────────────────────────────────────────── */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { emoji, color, bg } = ICONS[toast.type];
  const dur = toast.duration ?? 4000;

  return (
    <div className="animate-toast-in card-glass flex items-start gap-3 px-4 py-3 min-w-[300px] max-w-[420px] relative overflow-hidden"
      style={{ boxShadow: 'var(--shadow-xl)' }}
      role="alert"
    >
      {/* Icon */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
        style={{ backgroundColor: bg, color }}>
        {emoji}
      </div>

      {/* Message */}
      <p className="text-sm font-medium flex-1 py-0.5" style={{ color: 'var(--color-text-base)' }}>
        {toast.message}
      </p>

      {/* Close */}
      <button onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-[var(--color-elevated)]"
        style={{ color: 'var(--color-text-faint)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
        <div className="h-full rounded-full"
          style={{
            backgroundColor: color,
            animation: `progressBar ${dur}ms linear forwards`,
          }}
          onAnimationEnd={() => onDismiss(toast.id)}
        />
      </div>
    </div>
  );
}

/* ── Provider ───────────────────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container — fixed top-right */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          {toasts.slice(-5).map(toast => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
