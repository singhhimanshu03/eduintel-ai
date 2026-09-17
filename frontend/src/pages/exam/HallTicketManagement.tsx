import { useState } from 'react';
import { useGenerateHallTicket } from '../../hooks/useExams';
import PageHeader from '../../components/ui/PageHeader';

export default function HallTicketManagement() {
  const [studentId, setStudentId] = useState('');
  const [examCycle, setExamCycle] = useState('');
  const [results, setResults] = useState<Array<{ studentId: string; success: boolean; reasons?: string[] }>>([]);
  const mutation = useGenerateHallTicket();

  const handleGenerate = async () => {
    const res = await mutation.mutateAsync({ studentId, examCycle });
    setResults(prev => [{ studentId, success: res.success, reasons: res.reasons }, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Hall Ticket Management" subtitle="Check eligibility and generate examination hall tickets" />

      <div className="card p-5 flex gap-3 items-end flex-wrap">
        {[
          { label: 'Student ID', val: studentId, set: setStudentId, ph: 'UUID' },
          { label: 'Exam Cycle', val: examCycle, set: setExamCycle, ph: 'Nov-2024' },
        ].map(({ label, val, set, ph }) => (
          <div key={label} className="flex-1 min-w-[180px]">
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
            <input className="input-base" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
          </div>
        ))}
        <button onClick={handleGenerate} disabled={mutation.isPending || !studentId || !examCycle} className="btn-primary h-[42px]">
          {mutation.isPending ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Checking…</>
          ) : 'Generate'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>Results</h3>
          {results.map((r, i) => (
            <div key={i} className="rounded-xl p-4 animate-fade-in-up" style={{
              backgroundColor: r.success ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
              border: `1px solid ${r.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm" style={{ color: 'var(--color-text-base)' }}>{r.studentId}</span>
                <span className={`badge ${r.success ? 'badge-success' : 'badge-danger'}`}>
                  {r.success ? '✓ ELIGIBLE' : '✗ BLOCKED'}
                </span>
              </div>
              {!r.success && r.reasons && (
                <ul className="mt-2 space-y-1">
                  {r.reasons.map((reason, j) => (
                    <li key={j} className="text-xs flex gap-1.5" style={{ color: 'var(--color-danger)' }}>
                      <span>•</span>{reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
