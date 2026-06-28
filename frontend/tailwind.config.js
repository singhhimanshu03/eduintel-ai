/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Design tokens resolved from CSS variables ───────────────────────
        bg:      'var(--color-bg)',
        surface: 'var(--color-surface)',
        elevated:'var(--color-elevated)',
        border:  'var(--color-border)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover:   'var(--color-primary-hover)',
          muted:   'var(--color-primary-muted)',
        },
        tx: {
          base:  'var(--color-text-base)',
          muted: 'var(--color-text-muted)',
          faint: 'var(--color-text-faint)',
        },
        success: { DEFAULT: '#22C55E', muted: 'rgba(34,197,94,0.15)'  },
        warning: { DEFAULT: '#F59E0B', muted: 'rgba(245,158,11,0.15)' },
        danger:  { DEFAULT: '#EF4444', muted: 'rgba(239,68,68,0.15)'  },
      },
      borderRadius: {
        card: '0.75rem',   // 12px
        pill: '9999px',
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md':'0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'card-lg':'0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      transitionDuration: { fast: '150ms', normal: '200ms' },
    },
  },
  plugins: [],
};
