import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../app/api';
import PageHeader from '../components/ui/PageHeader';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.newPassword.length < 8)       { setError('Minimum 8 characters');  return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        <PageHeader title="Change Password" subtitle="Update your account password" />

        {success ? (
          <div className="card p-6 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-semibold" style={{ color: 'var(--color-success)' }}>
              Password updated successfully!
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {[
              ['Current Password', 'currentPassword', 'Enter current password'],
              ['New Password',     'newPassword',     'Min 8 characters'],
              ['Confirm Password', 'confirm',         'Re-enter new password'],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--color-text-base)' }}>{label}</label>
                <input type="password" className="input-base" placeholder={ph}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required />
              </div>
            ))}

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ borderLeft: '3px solid var(--color-danger)', backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
                {loading ? '⏳ Updating…' : 'Update Password'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1 py-2.5">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
