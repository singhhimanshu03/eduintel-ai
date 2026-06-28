import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ backgroundColor: 'var(--color-elevated)' }}>🔍</div>
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-base)' }}>404 — Page Not Found</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          The page you're looking for doesn't exist.
        </p>
      </div>
      <button onClick={() => navigate(-1)} className="btn-primary">← Go Back</button>
    </div>
  );
}
