import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../app/api';
import { useExamSchedules } from '../../hooks/useExams';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Schedule {
  id: string;
  subject_code: string;
  exam_date: string;
  start_time: string;
  venue: string;
  semester: number;
  is_published: boolean;
  duration_minutes?: number;
}

export default function ExamOverview() {
  const qc = useQueryClient();
  const { data: schedules = [], isLoading } = useExamSchedules();

  const [form, setForm] = useState({
    subjectCode: '', examDate: '', startTime: '',
    venue: '', durationMinutes: '120', semester: '',
  });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Create schedule
  const createSchedule = useMutation({
    mutationFn: () => api.post('/exams/schedules', {
      subjectCode:     form.subjectCode,
      examDate:        form.examDate,
      startTime:       form.startTime,
      venue:           form.venue,
      durationMinutes: parseInt(form.durationMinutes),
      semester:        parseInt(form.semester),
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-schedules'] });
      setForm({ subjectCode: '', examDate: '', startTime: '', venue: '', durationMinutes: '120', semester: '' });
      showToast('Schedule created successfully.', true);
    },
    onError: () => showToast('Failed to create schedule.', false),
  });

  // Publish schedule
  const publishSchedule = useMutation({
    mutationFn: (scheduleId: string) =>
      api.put(`/exams/schedules/${scheduleId}/publish`).then(r => r.data),
    onSuccess: (_data, scheduleId) => {
      qc.invalidateQueries({ queryKey: ['exam-schedules'] });
      showToast('Schedule published successfully. Students have been notified.', true);
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? 'Failed to publish schedule.';
      showToast(msg, false);
    },
  });

  const schedulesArr = schedules as Schedule[];
  const draftCount     = schedulesArr.filter(s => !s.is_published).length;
  const publishedCount = schedulesArr.filter(s =>  s.is_published).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Schedules"
        subtitle={`${publishedCount} published · ${draftCount} draft`}
      />

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2"
          style={{
            backgroundColor: toast.ok ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
            color:           toast.ok ? 'var(--color-success)'        : 'var(--color-danger)',
            border:          `1px solid ${toast.ok ? 'var(--color-success)' : 'var(--color-danger)'}`,
          }}
        >
          <span>{toast.ok ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      {/* Create form */}
      <div className="card p-5">
        <p className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text-base)' }}>
          + New Exam Schedule
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {([
            ['Subject Code',     'subjectCode',     'CS301',  'text'],
            ['Exam Date',        'examDate',        '',       'date'],
            ['Start Time',       'startTime',       '10:00',  'time'],
            ['Venue',            'venue',           'Hall A', 'text'],
            ['Duration (mins)',  'durationMinutes', '120',    'number'],
            ['Semester',         'semester',        '3',      'number'],
          ] as [string, string, string, string][]).map(([label, key, placeholder, type]) => (
            <div key={key}>
              <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </label>
              <input
                type={type}
                className="input-base"
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => createSchedule.mutate()}
          disabled={createSchedule.isPending || !form.subjectCode || !form.examDate || !form.semester}
          className="btn-primary mt-4"
        >
          {createSchedule.isPending ? '⏳ Creating…' : 'Create Schedule'}
        </button>
      </div>

      {/* Schedules table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : schedulesArr.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-2 opacity-40">📅</p>
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
            No exam schedules yet. Create one above.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-elevated)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  {['Subject', 'Date', 'Time', 'Venue', 'Semester', 'Duration', 'Status', 'Action'].map(h => (
                    <th key={h}
                      className="px-4 py-3 text-left font-semibold uppercase tracking-wider"
                      style={{ fontSize: '0.6875rem', color: 'var(--color-text-faint)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedulesArr.map((s, i) => (
                  <tr key={s.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-elevated)',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text-base)' }}>
                      {s.subject_code}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {s.exam_date?.split('T')[0] ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {s.start_time ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {s.venue ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {s.semester}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>
                      {s.duration_minutes ? `${s.duration_minutes} min` : '—'}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`badge ${s.is_published ? 'badge-success' : 'badge-neutral'}`}>
                        {s.is_published ? '✓ Published' : '○ Draft'}
                      </span>
                    </td>

                    {/* Publish action */}
                    <td className="px-4 py-3">
                      {s.is_published ? (
                        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                          —
                        </span>
                      ) : (
                        <button
                          onClick={() => publishSchedule.mutate(s.id)}
                          disabled={publishSchedule.isPending && publishSchedule.variables === s.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            backgroundColor: 'var(--color-primary-muted)',
                            color: 'var(--color-primary)',
                            border: '1px solid var(--color-primary)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)', e.currentTarget.style.color = '#fff')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-muted)', e.currentTarget.style.color = 'var(--color-primary)')}
                        >
                          {publishSchedule.isPending && publishSchedule.variables === s.id
                            ? '⏳ Publishing…'
                            : '🚀 Publish'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
