import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../features/auth/authService';
import PageHeader from '../../components/ui/PageHeader';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import type { UserRole } from '../../types';

// ── Validation Schema ───────────────────────────────────────────────────────────
const schema = z.object({
  role:            z.enum(['student', 'faculty', 'parent', 'examination_cell', 'placement_cell']),
  email:           z.string().email('Valid email required'),
  fullName:        z.string().min(2, 'Full name is required'),
  // Student fields
  studentCode:     z.string().optional(),
  phone:           z.string().optional(),
  gender:          z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  dateOfBirth:     z.string().optional(),
  currentSemester: z.coerce.number().int().min(1).max(12).optional().or(z.literal(0).transform(() => undefined)),
  departmentId:    z.string().optional(),
  courseId:        z.string().optional(),
  // Faculty fields
  facultyCode:     z.string().optional(),
  designation:     z.string().optional(),
  // Parent fields
  studentId:       z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'student' && !data.studentCode) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Student code is required', path: ['studentCode'] });
  }
  if (data.role === 'faculty' && !data.facultyCode) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Faculty code is required', path: ['facultyCode'] });
  }
  if (data.role === 'parent' && !data.studentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Student ID is required', path: ['studentId'] });
  }
});

type FormData = z.infer<typeof schema>;

// ── Role metadata ───────────────────────────────────────────────────────────────
const ROLE_OPTIONS: { value: FormData['role']; label: string; icon: string; desc: string }[] = [
  { value: 'student',          label: 'Student',          icon: '🎓', desc: 'Academic access' },
  { value: 'faculty',          label: 'Faculty',          icon: '👨‍🏫', desc: 'Teaching & grading' },
  { value: 'parent',           label: 'Parent/Guardian',  icon: '👨‍👩‍👧', desc: 'Monitor progress' },
  { value: 'examination_cell', label: 'Exam Cell',        icon: '📝', desc: 'Exam management' },
  { value: 'placement_cell',   label: 'Placement Cell',   icon: '💼', desc: 'Placement drives' },
];

/* ── Field component with icon ─────────────────────────────────────── */
function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs mt-1.5 animate-fade-in" style={{ color: 'var(--color-danger)' }}>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function CreateUser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetRole = searchParams.get('role') as FormData['role'] | null;
  const institutionId = useSelector((s: RootState) => s.auth.institutionId);
  const [success, setSuccess] = useState<{ email: string } | null>(null);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: presetRole || 'student' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setApiError('');
    try {
      // Clean up fields irrelevant to this role
      const payload: Record<string, unknown> = {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        institutionId: institutionId ?? '',
      };
      if (data.role === 'student') {
        Object.assign(payload, {
          studentCode: data.studentCode,
          phone: data.phone || undefined,
          gender: data.gender || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          currentSemester: data.currentSemester || undefined,
          departmentId: data.departmentId || undefined,
          courseId: data.courseId || undefined,
        });
      } else if (data.role === 'faculty') {
        Object.assign(payload, {
          facultyCode: data.facultyCode,
          phone: data.phone || undefined,
          departmentId: data.departmentId || undefined,
          designation: data.designation || undefined,
        });
      } else if (data.role === 'parent') {
        payload.studentId = data.studentId;
      }

      await authService.createUser(payload as Parameters<typeof authService.createUser>[0]);
      setSuccess({ email: data.email });
      reset();
    } catch (err: unknown) {
      setApiError((err as Error).message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="space-y-6 max-w-2xl">
        <PageHeader title="Create User" subtitle="Admin-only account provisioning" />
        <div className="card p-8 text-center space-y-4 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto"
            style={{ backgroundColor: 'var(--color-success-muted)' }}>✉️</div>
          <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
            Invite Sent!
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            An invitation email has been sent to <strong style={{ color: 'var(--color-primary)' }}>{success.email}</strong>.
            <br />They will set their own password using the link in the email.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => setSuccess(null)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Another
            </button>
            <button onClick={() => navigate('/admin')} className="btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Create User"
        subtitle="Provision a new account — the user will set their own password via an invite link"
        action={
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
        {/* ── Role Selection ── */}
        <div>
          <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-base)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Select Role
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {ROLE_OPTIONS.map(r => (
              <button key={r.value} type="button"
                onClick={() => setValue('role', r.value, { shouldValidate: true })}
                className="p-3 rounded-xl text-center transition-all duration-200 border"
                style={{
                  backgroundColor: selectedRole === r.value ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                  borderColor: selectedRole === r.value ? 'var(--color-primary)' : 'var(--color-border)',
                  boxShadow: selectedRole === r.value ? 'var(--shadow-glow)' : 'none',
                }}>
                <div className="text-xl mb-1">{r.icon}</div>
                <p className="text-[11px] font-semibold" style={{
                  color: selectedRole === r.value ? 'var(--color-primary)' : 'var(--color-text-base)'
                }}>{r.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>{r.desc}</p>
              </button>
            ))}
          </div>
          {errors.role && <p className="text-xs mt-1.5" style={{ color: 'var(--color-danger)' }}>Please select a role</p>}
        </div>

        <hr className="divider" />

        {/* ── Common Fields ── */}
        <div>
          <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-base)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Account Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.fullName?.message}>
              <div className="input-icon-wrapper">
                <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                <input {...register('fullName')} placeholder="Dr. Ramesh Kumar" className="input-base" />
              </div>
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <div className="input-icon-wrapper">
                <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input {...register('email')} placeholder="user@institution.edu" className="input-base" />
              </div>
            </Field>
          </div>
        </div>

        {/* ── Student-specific Fields ── */}
        {selectedRole === 'student' && (
          <>
            <hr className="divider" />
            <div>
              <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-base)' }}>
                <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
                Student Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Student Code" required error={errors.studentCode?.message}>
                  <div className="input-icon-wrapper">
                    <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                    </svg>
                    <input {...register('studentCode')} placeholder="CS2024001" className="input-base" />
                  </div>
                </Field>
                <Field label="Phone">
                  <div className="input-icon-wrapper">
                    <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <input {...register('phone')} placeholder="+91 9876543210" className="input-base" />
                  </div>
                </Field>
                <Field label="Gender">
                  <select {...register('gender')} className="input-base select-styled">
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Date of Birth">
                  <input type="date" {...register('dateOfBirth')} className="input-base" />
                </Field>
                <Field label="Current Semester">
                  <input type="number" min={1} max={12} {...register('currentSemester')} className="input-base" placeholder="1" />
                </Field>
                <Field label="Department ID">
                  <input {...register('departmentId')} className="input-base" placeholder="UUID (optional)" />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Faculty-specific Fields ── */}
        {selectedRole === 'faculty' && (
          <>
            <hr className="divider" />
            <div>
              <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-base)' }}>
                <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Faculty Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Faculty Code" required error={errors.facultyCode?.message}>
                  <input {...register('facultyCode')} placeholder="FAC004" className="input-base" />
                </Field>
                <Field label="Phone">
                  <input {...register('phone')} placeholder="+91 9876543210" className="input-base" />
                </Field>
                <Field label="Designation">
                  <select {...register('designation')} className="input-base select-styled">
                    <option value="">Select…</option>
                    <option>Professor</option>
                    <option>Associate Professor</option>
                    <option>Assistant Professor</option>
                    <option>Lecturer</option>
                  </select>
                </Field>
                <Field label="Department ID">
                  <input {...register('departmentId')} className="input-base" placeholder="UUID (optional)" />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Parent-specific Fields ── */}
        {selectedRole === 'parent' && (
          <>
            <hr className="divider" />
            <div>
              <h3 className="text-sm font-heading font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-text-base)' }}>
                <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Link to Student
              </h3>
              <Field label="Student ID" required error={errors.studentId?.message}>
                <input {...register('studentId')} className="input-base" placeholder="UUID of the student to link as parent" />
              </Field>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-faint)' }}>
                The parent account will be linked to this student's <code className="px-1 py-0.5 rounded text-[11px]"
                  style={{ backgroundColor: 'var(--color-elevated)' }}>parent_id</code> field.
              </p>
            </div>
          </>
        )}

        {/* ── Exam/Placement info ── */}
        {(selectedRole === 'examination_cell' || selectedRole === 'placement_cell') && (
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ backgroundColor: 'var(--color-primary-muted)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-xs" style={{ color: 'var(--color-primary)' }}>
              This role only needs an email and name — no additional profile is created.
            </p>
          </div>
        )}

        {/* ── API Error ── */}
        {apiError && (
          <div className="flex items-center gap-2 p-3 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-danger-muted)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--color-danger)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{apiError}</p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create & Send Invite
              </>
            )}
          </button>
          <button type="button" onClick={() => reset()} className="btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
