import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';

export default function MarksEntry() {
  const [form, setForm] = useState({
    studentId: '', subjectCode: '', semester: '',
    academicYear: new Date().getFullYear().toString(),
    internalMarks: '', semesterMarks: '',
  });
  const [result, setResult] = useState<{ grade?: string; gpa_points?: number; is_backlog?: boolean } | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/exams/marks', {
      studentId: form.studentId, subjectCode: form.subjectCode,
      semester: parseInt(form.semester), academicYear: form.academicYear,
      internalMarks: parseFloat(form.internalMarks), semesterMarks: parseFloat(form.semesterMarks),
    }).then(r => r.data.data),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Marks Entry" subtitle="Enter internal and semester examination marks" />
      <div className="card p-6 space-y-5">
        <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
          <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Enter Marks
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Student ID',    'studentId',    'STU001'],
            ['Subject Code',  'subjectCode',  'CS301'],
            ['Semester',      'semester',     '3'],
            ['Academic Year', 'academicYear', '2024'],
            ['Internal Marks','internalMarks','40'],
            ['Semester Marks','semesterMarks','60'],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
              <input className="input-base" placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Saving…</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> Save Marks</>
          )}
        </button>
        {mutation.isError && (
          <div className="flex items-center gap-2 p-3 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-danger-muted)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--color-danger)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
              {String((mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save marks')}
            </p>
          </div>
        )}
        {result && (
          <div className="rounded-xl p-5 animate-scale-in" style={{
            backgroundColor: result.is_backlog ? 'var(--color-danger-muted)' : 'var(--color-success-muted)',
            border: `1px solid ${result.is_backlog ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                style={{ background: result.is_backlog ? 'var(--gradient-danger)' : 'var(--gradient-success)' }}>
                {result.grade}
              </div>
              <div>
                <p className="text-base font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
                  Grade: {result.grade} | GPA: {result.gpa_points}
                </p>
                {result.is_backlog && (
                  <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--color-danger)' }} />
                    Backlog — student has failed this subject
                  </p>
                )}
                {!result.is_backlog && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-success)' }}>✓ Passed successfully</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
