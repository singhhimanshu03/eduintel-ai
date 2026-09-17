/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Design tokens resolved from CSS variables ───────────────────
        bg:      'var(--color-bg)',
        surface: 'var(--color-surface)',
        elevated:'var(--color-elevated)',
        border:  'var(--color-border)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover:   'var(--color-primary-hover)',
          muted:   'var(--color-primary-muted)',
          glow:    'var(--color-primary-glow)',
        },
        tx: {
          base:  'var(--color-text-base)',
          muted: 'var(--color-text-muted)',
          faint: 'var(--color-text-faint)',
        },
        success: { DEFAULT: 'var(--color-success)', muted: 'var(--color-success-muted)' },
        warning: { DEFAULT: 'var(--color-warning)', muted: 'var(--color-warning-muted)' },
        danger:  { DEFAULT: 'var(--color-danger)',  muted: 'var(--color-danger-muted)'  },
        info:    { DEFAULT: 'var(--color-info)',     muted: 'var(--color-info-muted)'    },
      },
      borderRadius: {
        sm:   '0.5rem',
        md:   '0.75rem',
        lg:   '1rem',
        xl:   '1.25rem',
        '2xl':'1.5rem',
        pill: '9999px',
      },
      boxShadow: {
        xs:       'var(--shadow-xs)',
        sm:       'var(--shadow-sm)',
        md:       'var(--shadow-md)',
        lg:       'var(--shadow-lg)',
        xl:       'var(--shadow-xl)',
        glow:     'var(--shadow-glow)',
        'glow-lg':'var(--shadow-glow-lg)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'fade-in':      'fadeIn 300ms ease-out both',
        'fade-in-up':   'fadeInUp 400ms ease-out both',
        'fade-in-down': 'fadeInDown 300ms ease-out both',
        'slide-right':  'slideInRight 300ms ease-out both',
        'scale-in':     'scaleIn 250ms ease-out both',
        'slide-down':   'slideDown 200ms ease-out both',
        'toast-in':     'toastIn 300ms ease-out both',
        'toast-out':    'toastOut 200ms ease-in both',
        'bell-shake':   'bellShake 500ms ease-in-out',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'pulse-dot':    'pulseDot 2s ease-in-out infinite',
        'counter':      'counterUp 400ms ease-out both',
        'shimmer':      'shimmer 1.5s ease-in-out infinite',
        'progress':     'progressBar linear',
      },
      transitionDuration: {
        fast:   '150ms',
        normal: '200ms',
        slow:   '300ms',
      },
      backdropBlur: {
        glass: '16px',
      },
      spacing: {
        'sidebar':      '260px',
        'sidebar-mini': '72px',
      },
    },
  },
  plugins: [],
};
