import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Animated 404 */}
      <div className="animate-fade-in-up">
        <h1 className="text-8xl font-heading font-extrabold text-gradient tracking-tight text-center">
          404
        </h1>
      </div>

      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl animate-fade-in-up stagger-1"
        style={{ backgroundColor: 'var(--color-elevated)' }}>
        🔍
      </div>

      <div className="text-center animate-fade-in-up stagger-2">
        <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
          Page Not Found
        </h2>
        <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
      </div>

      <div className="flex gap-3 animate-fade-in-up stagger-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Go Back
        </button>
        <button onClick={() => navigate('/')} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
          </svg>
          Home
        </button>
      </div>
    </div>
  );
}
