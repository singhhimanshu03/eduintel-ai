import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';

const REPORT_TYPES = [
  { id: 'attendance',     label: 'Attendance Report',         icon: '📋' },
  { id: 'fees',           label: 'Fee Collection Report',     icon: '💰' },
  { id: 'academic',       label: 'Academic Performance Report',icon: '📚' },
  { id: 'eligibility',   label: 'Eligibility Report',        icon: '✅' },
  { id: 'ai-predictions', label: 'AI Predictions Report',     icon: '🤖' },
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
      a.href     = url;
      a.download = `${type}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed. Please try again.'); }
    finally  { setDownloading(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export academic and operational reports" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map(rt => (
          <div key={rt.id} className="card p-5 space-y-4 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{rt.icon}</span>
              <h3 className="font-semibold text-gray-800 dark:text-white">{rt.label}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => download(rt.id, 'excel')} disabled={!!downloading}
                className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40
                  text-green-700 dark:text-green-300 text-sm px-3 py-1.5 rounded-lg
                  hover:bg-green-100 dark:hover:bg-green-900/40 transition disabled:opacity-50">
                {downloading === `${rt.id}-excel` ? '⏳ Exporting…' : '📊 Excel'}
              </button>
              <button onClick={() => download(rt.id, 'pdf')} disabled={!!downloading}
                className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40
                  text-red-700 dark:text-red-300 text-sm px-3 py-1.5 rounded-lg
                  hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50">
                {downloading === `${rt.id}-pdf` ? '⏳ Exporting…' : '📄 PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
