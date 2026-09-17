import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';

const REPORT_TYPES = [
  { id: 'attendance',    label: 'Attendance Report',          icon: '📋', desc: 'Student-wise and subject-wise attendance data' },
  { id: 'fees',          label: 'Fee Collection Report',      icon: '💰', desc: 'Fee payment status and defaulter breakdown' },
  { id: 'academic',      label: 'Academic Performance Report',icon: '📚', desc: 'Grades, GPAs, and backlog analysis' },
  { id: 'eligibility',   label: 'Eligibility Report',         icon: '✅', desc: 'Exam eligibility based on AI risk scores' },
  { id: 'ai-predictions',label: 'AI Predictions Report',      icon: '🤖', desc: 'Dropout risk and performance forecasts' },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (type: string, format: 'excel' | 'pdf') => {
    setDownloading(`${type}-${format}`);
    try {
      const resp = await fetch(`/api/analytics/reports/${type}/export?format=${format}`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth') || '{}').accessToken}` },
      });
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${type}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('Export failed. Please try again.'); }
    finally  { setDownloading(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export academic and operational reports" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((rt, i) => (
          <div key={rt.id} className={`card card-hover-lift p-5 space-y-4 animate-fade-in-up stagger-${i + 1}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: 'var(--color-elevated)' }}>{rt.icon}</div>
              <div>
                <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>{rt.label}</h3>
                <p className="text-[11px]" style={{ color: 'var(--color-text-faint)' }}>{rt.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => download(rt.id, 'excel')} disabled={!!downloading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150
                  disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-success-muted)', color: 'var(--color-success)' }}>
                {downloading === `${rt.id}-excel` ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : '📊'} Excel
              </button>
              <button onClick={() => download(rt.id, 'pdf')} disabled={!!downloading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150
                  disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                {downloading === `${rt.id}-pdf` ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : '📄'} PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
