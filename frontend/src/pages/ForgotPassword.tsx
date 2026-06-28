import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../features/auth/authService';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card-lg)' }}>

        {sent ? (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto"
              style={{ backgroundColor: 'var(--color-success-muted)' }}>📬</div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>Reset link sent</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Check your inbox for a password reset link. It expires in 60 minutes.
              </p>
            </div>
            <Link to="/login" className="btn-primary inline-flex">Back to Login →</Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-base)' }}>
                Forgot Password
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Enter your email to receive a reset link
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-base)' }}>
                  Email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="input-base" placeholder="you@institution.edu" />
              </div>
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ borderLeft: '3px solid var(--color-danger)', backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading || !email} className="btn-primary w-full py-2.5">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <Link to="/login" className="font-medium transition-colors duration-150"
                  style={{ color: 'var(--color-primary)' }}>
                  ← Back to Login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
