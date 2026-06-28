import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../features/auth/authService';
import { useTheme } from '../context/ThemeContext';
import type { UserRole } from '../types';

const schema = z.object({
  email:         z.string().email('Invalid email'),
  password:      z.string().min(8, 'Minimum 8 characters'),
  role:          z.enum(['college_admin','faculty','student','parent','examination_cell','placement_cell']),
  institutionId: z.string().uuid('Must be a valid UUID').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: 'college_admin',    label: 'College Admin',    icon: '🏫' },
  { value: 'faculty',          label: 'Faculty',          icon: '👨‍🏫' },
  { value: 'student',          label: 'Student',          icon: '🎓' },
  { value: 'parent',           label: 'Parent',           icon: '👨‍👩‍👧' },
  { value: 'examination_cell', label: 'Examination Cell', icon: '📝' },
  { value: 'placement_cell',   label: 'Placement Cell',   icon: '💼' },
];

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707
         M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);
const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

export default function Register() {
  const navigate  = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true); setError('');
    try {
      await authService.register({
        email: data.email, password: data.password, role: data.role,
        institutionId: data.institutionId || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm text-center space-y-5 p-10 rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card-lg)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto"
            style={{ backgroundColor: 'var(--color-success-muted)' }}>✉️</div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-base)' }}>Check your email</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              A verification link has been sent to your email address.
            </p>
          </div>
          <Link to="/login" className="btn-primary inline-flex" onClick={() => navigate('/login')}>
            Back to Login →
          </Link>
        </div>
      </div>
    );
  }

  // ── Register form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-xl transition-colors duration-150"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        aria-label="Toggle theme"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card-lg)' }}>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-white text-xl font-bold"
            style={{ backgroundColor: 'var(--color-primary)' }}>EI</div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-base)' }}>
            Create Account
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Join EduIntel AI Platform
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-base)' }}>
              Email
            </label>
            <input type="email" {...register('email')} className="input-base"
              placeholder="you@institution.edu" />
            {errors.email && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
                ⚠ {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-base)' }}>
              Password
            </label>
            <input type="password" {...register('password')} className="input-base"
              placeholder="Min 8 characters" />
            {errors.password && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
                ⚠ {errors.password.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-base)' }}>
              Role
            </label>
            <select {...register('role')} className="input-base">
              <option value="">Select your role…</option>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
              ))}
            </select>
            {errors.role && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>⚠ {errors.role.message}</p>
            )}
          </div>

          {/* Institution ID */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-base)' }}>
              Institution ID{' '}
              <span className="font-normal text-xs" style={{ color: 'var(--color-text-faint)' }}>(optional)</span>
            </label>
            <input type="text" {...register('institutionId')} className="input-base"
              placeholder="UUID of your institution" />
            {errors.institutionId && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>⚠ {errors.institutionId.message}</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
              style={{ borderLeft: '3px solid var(--color-danger)', backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
              <span>✕</span><span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>

          <div className="divider my-2" />

          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold transition-colors duration-150"
              style={{ color: 'var(--color-primary)' }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
