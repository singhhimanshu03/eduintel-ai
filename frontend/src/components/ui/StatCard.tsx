import { useEffect, useRef, useState } from 'react';

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
    gradient: 'var(--gradient-primary)',
    muted:    'var(--color-primary-muted)',
    text:     'var(--color-primary)',
    iconBg:   'linear-gradient(135deg, #6366F1, #8B5CF6)',
  },
  green: {
    gradient: 'var(--gradient-success)',
    muted:    'var(--color-success-muted)',
    text:     'var(--color-success)',
    iconBg:   'linear-gradient(135deg, #10B981, #34D399)',
  },
  yellow: {
    gradient: 'var(--gradient-warning)',
    muted:    'var(--color-warning-muted)',
    text:     'var(--color-warning)',
    iconBg:   'linear-gradient(135deg, #F59E0B, #FBBF24)',
  },
  red: {
    gradient: 'var(--gradient-danger)',
    muted:    'var(--color-danger-muted)',
    text:     'var(--color-danger)',
    iconBg:   'linear-gradient(135deg, #EF4444, #F97316)',
  },
};

/* ── Animated counter ──────────────────────────────────────────────────── */
function AnimatedValue({ value }: { value: string | number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const numericMatch = String(value).match(/^([^\d]*)([\d,]+\.?\d*)(.*)/);
    if (!numericMatch) { setDisplay(value); return; }
    const prefix = numericMatch[1];
    const suffix = numericMatch[3];
    const target = parseFloat(numericMatch[2].replace(/,/g, ''));
    if (isNaN(target)) { setDisplay(value); return; }

    const isFloat = numericMatch[2].includes('.');
    const startTime = performance.now();
    const duration = 800;

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      const formatted = isFloat
        ? current.toFixed(1)
        : Math.round(current).toLocaleString();
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{display}</>;
}

export default function StatCard({ title, value, icon, color = 'indigo', subtitle, trend }: StatCardProps) {
  const t = colorTokens[color];
  return (
    <div className="card card-hover-lift relative overflow-hidden p-5 group">
      {/* Background gradient accent */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 pointer-events-none
        group-hover:opacity-30 transition-opacity duration-300"
        style={{ background: t.gradient, filter: 'blur(20px)' }} />

      <div className="relative flex items-start justify-between gap-3">
        {/* Gradient icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0
          shadow-md transition-transform duration-200 group-hover:scale-110"
          style={{ background: t.iconBg, color: '#fff' }}>
          {icon}
        </div>

        {/* Trend badge */}
        {trend && (
          <span className={`badge text-[10px] flex-shrink-0 gap-1 ${trend.up ? 'badge-success' : 'badge-danger'}`}>
            <svg className={`w-3 h-3 ${trend.up ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
            {trend.value}
          </span>
        )}
      </div>

      <div className="relative mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
          {title}
        </p>
        <p className="text-2xl font-heading font-bold mt-1 tracking-tight animate-counter" style={{ color: t.text }}>
          <AnimatedValue value={value} />
        </p>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
