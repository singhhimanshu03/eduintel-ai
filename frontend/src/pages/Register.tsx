import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../features/auth/authService';
import type { UserRole } from '../types';

const schema = z.object({
  email:       z.string().email('Invalid email'),
  password:    z.string().min(8, 'Minimum 8 characters'),
  role:        z.enum(['college_admin','faculty','student','parent','examination_cell','placement_cell']),
  institutionId: z.string().uuid('Must be a valid UUID').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'college_admin',    label: 'College Admin' },
  { value: 'faculty',          label: 'Faculty' },
  { value: 'student',          label: 'Student' },
  { value: 'parent',           label: 'Parent' },
  { value: 'examination_cell', label: 'Examination Cell' },
  { value: 'placement_cell',   label: 'Placement Cell' },
];

export default function Register() {
  const navigate = useNavigate();
  const [error, setError]     = useState('');
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
      setError((err as Error).message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center space-y-4">
          <span className="text-5xl">✉️</span>
          <h2 className="text-xl font-bold text-gray-800">Check your email</h2>
          <p className="text-gray-500 text-sm">A verification link has been sent to your email address.</p>
          <Link to="/login" className="block text-indigo-600 text-sm hover:underline">Back to Login →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">EduIntel AI Platform</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" {...register('email')} className={inputCls} placeholder="you@institution.edu" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input type="password" {...register('password')} className={inputCls} placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select {...register('role')} className={inputCls}>
              <option value="">Select role…</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Institution ID <span className="text-gray-400">(optional)</span></label>
            <input type="text" {...register('institutionId')} className={inputCls} placeholder="UUID of your institution" />
            {errors.institutionId && <p className="text-red-500 text-xs mt-1">{errors.institutionId.message}</p>}
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
