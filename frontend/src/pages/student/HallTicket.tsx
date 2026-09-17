import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGenerateHallTicket } from '../../hooks/useExams';
import PageHeader from '../../components/ui/PageHeader';
import api from '../../app/api';

export default function HallTicket() {
  const { userId } = useAuth();
  const [examCycle, setExamCycle] = useState('');
  const [result, setResult] = useState<{ success?: boolean; reasons?: string[]; data?: { pdfUrl?: string } } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const mutation = useGenerateHallTicket();

  const handleGenerate = async () => {
    const res = await mutation.mutateAsync({ studentId: userId ?? '', examCycle });
    setResult(res);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/exams/hall-tickets/${userId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hall-ticket-${examCycle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Hall Ticket" subtitle="Check eligibility and download your exam admission card" />

      <div className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Exam Cycle</label>
          <input className="input-base" placeholder="e.g. Nov-2024" value={examCycle} onChange={e => setExamCycle(e.target.value)} />
        </div>
        <button onClick={handleGenerate} disabled={mutation.isPending || !examCycle} className="btn-primary w-full">
          {mutation.isPending ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Checking eligibility…</>
          ) : 'Check Eligibility & Generate'}
        </button>
      </div>

      {result && (
        <div className="rounded-xl p-5 animate-scale-in" style={{
          backgroundColor: result.success ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
          border: `1px solid ${result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          {result.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: 'var(--color-success-muted)' }}>🎫</div>
                <div>
                  <p className="font-heading font-bold text-sm" style={{ color: 'var(--color-success)' }}>You are eligible!</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Your hall ticket has been generated.</p>
                </div>
              </div>
              <button onClick={handleDownloadPDF} disabled={downloading} className="btn-success">
                {downloading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg> Preparing PDF…</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg> Download Hall Ticket PDF</>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: 'var(--color-danger-muted)' }}>🚫</div>
                <p className="font-heading font-bold text-sm" style={{ color: 'var(--color-danger)' }}>Not eligible for hall ticket</p>
              </div>
              <ul className="space-y-2">
                {(result.reasons ?? []).map((r, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-danger)' }}>
                    <span className="mt-0.5">✕</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
