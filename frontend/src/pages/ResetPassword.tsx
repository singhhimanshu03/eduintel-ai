import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../features/auth/authService';

export default function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get('token') ?? '';
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Minimum 8 characters');  return; }
    setLoading(true); setError('');
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Reset failed. Link may have expired.');
    } finally { setLoading(false); }
  };

  // Invalid token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center space-y-4">
          <span className="text-4xl">⛔</span>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Invalid reset link.</p>
          <Link to="/forgot-password" className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            Request a new one →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card-lg)' }}>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto"
              style={{ backgroundColor: 'var(--color-success-muted)' }}>✅</div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>Password reset!</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Redirecting to login…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-base)' }}>
                Set New Password
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Choose a strong password (min 8 characters)
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-base)' }}>
                  New Password
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-base" placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-base)' }}>
                  Confirm Password
                </label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="input-base" placeholder="••••••••" required />
              </div>
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ borderLeft: '3px solid var(--color-danger)', backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
