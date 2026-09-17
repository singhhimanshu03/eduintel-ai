import { useState } from 'react';
import { usePublishResults } from '../../hooks/useExams';
import PageHeader from '../../components/ui/PageHeader';

export default function ResultPublish() {
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [published, setPublished] = useState(false);
  const mutation = usePublishResults();

  const handlePublish = async () => {
    if (!confirm(`Publish Semester ${semester} results? This will notify all enrolled students.`)) return;
    await mutation.mutateAsync({ semester: parseInt(semester), academicYear });
    setPublished(true);
  };

  return (
    <div className="space-y-6 max-w-md">
      <PageHeader title="Publish Results" subtitle="Release examination results to students" />
      <div className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Semester</label>
          <input className="input-base" placeholder="3" value={semester} onChange={e => setSemester(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Academic Year</label>
          <input className="input-base" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        </div>
        <button onClick={handlePublish} disabled={mutation.isPending || !semester} className="btn-success w-full">
          {mutation.isPending ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Publishing…</>
          ) : (
            <>📢 Publish Results</>
          )}
        </button>
        {published && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl animate-scale-in"
            style={{ backgroundColor: 'var(--color-success-muted)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-success)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
              Semester {semester} results published. All students notified.
            </p>
          </div>
        )}
        {mutation.isError && (
          <div className="flex items-center gap-2 p-3 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-danger-muted)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--color-danger)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>Failed to publish. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
