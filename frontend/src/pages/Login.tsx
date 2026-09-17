import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import { setCredentials } from '../features/auth/authSlice';
import { authService } from '../features/auth/authService';
import { useTheme } from '../context/ThemeContext';

// ── Validation Schema ───────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();
  const { isDark } = useTheme();
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const ROLE_HOME: Record<string, string> = {
    super_admin: '/admin', college_admin: '/admin', faculty: '/faculty',
    student: '/student', parent: '/parent', examination_cell: '/exam', placement_cell: '/placement',
  };

  /**
   * Extract a user-facing message from whatever the auth interceptor throws.
   * Auth endpoints bypass the standardizer and return raw AxiosErrors, so we
   * need to handle both shapes:
   *   - AxiosError  → error.response.data.message  (from backend JSON body)
   *   - Error       → error.message                (standardized by interceptor)
   */
  function extractErrorMessage(err: unknown): string {
    // Raw AxiosError — auth endpoint bypass path
    const axiosErr = err as AxiosError<{ message?: string }>;
    if (axiosErr?.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    // Standardized Error from non-auth interceptor path
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return 'Login failed. Please try again.';
  }

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ email: data.email, password: data.password });
      dispatch(setCredentials(res));

      // Redirect to where the user was trying to go (deep-link), their role
      // home, or /unauthorized if the role is unrecognised.
      const from = (location.state as { from?: Location })?.from?.pathname;
      const dest = from && from !== '/login' ? from : (ROLE_HOME[res.role] ?? '/unauthorized');
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: isDark
        ? 'var(--gradient-dark)'
        : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 30%, #F5F3FF 60%, #FDF4FF 100%)'
      }}>

      {/* Floating gradient orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #A855F7 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* Login card */}
      <div className="w-full max-w-md animate-scale-in">
        <div className="card-glass p-8" style={{ boxShadow: 'var(--shadow-xl)' }}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold mx-auto mb-4"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-lg)' }}>
              EI
            </div>
            <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
              Welcome back
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Sign in to EduIntel AI
            </p>
          </div>

          {/* API Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl animate-fade-in"
              style={{ backgroundColor: 'var(--color-danger-muted)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--color-danger)" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Email Address
              </label>
              <div className="input-icon-wrapper">
                <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@eduintel.edu"
                  className="input-base" autoFocus
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1.5 text-xs mt-1.5 animate-fade-in" style={{ color: 'var(--color-danger)' }}>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  Password
                </label>
                <Link to="/forgot-password"
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: 'var(--color-primary)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="input-icon-wrapper relative">
                <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-faint)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    {showPw ? (
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 text-xs mt-1.5 animate-fade-in" style={{ color: 'var(--color-danger)' }}>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-sm">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-faint)' }}>
          © {new Date().getFullYear()} EduIntel AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
