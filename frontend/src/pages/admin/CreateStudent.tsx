import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';

export default function CreateStudent() {
  const navigate = useNavigate();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ imported: number; failed: number } | null>(null);

  const handleBulkImport = async () => {
    if (!csvFile) return;
    setBulkLoading(true);
    const form = new FormData();
    form.append('file', csvFile);
    try {
      const res = await api.post('/students/bulk-import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const json = res.data;
      setBulkResult({ imported: json.data?.imported ?? 0, failed: json.data?.failed ?? 0 });
    } catch {
      alert('Bulk import failed. Check your CSV format.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Add Student"
        subtitle="Create a single student account or bulk import via CSV"
        action={
          <button onClick={() => navigate('/admin/students')} className="btn-ghost text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to list
          </button>
        }
      />

      {/* ── Single student — redirects to unified CreateUser ── */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
          <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          Create Single Student
        </h3>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Creates a student account with a linked login. The student will receive an invite email to set their own password.
        </p>
        <button onClick={() => navigate('/admin/users/new?role=student')} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Student Account
        </button>
      </div>

      {/* ── Bulk import ── */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
          <svg className="w-4 h-4" fill="none" stroke="var(--color-success)" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Bulk Import via CSV
        </h3>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          CSV columns: <code className="px-1.5 py-0.5 rounded text-[11px]"
            style={{ backgroundColor: 'var(--color-elevated)' }}>
            student_code, full_name, email, phone, gender, current_semester
          </code>
        </p>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Select CSV File
            </label>
            <input type="file" accept=".csv"
              onChange={e => setCsvFile(e.target.files?.[0] ?? null)}
              className="input-base py-1.5 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold
                file:bg-[var(--color-primary-muted)] file:text-[var(--color-primary)] file:cursor-pointer" />
          </div>
          <button onClick={handleBulkImport} disabled={!csvFile || bulkLoading} className="btn-success h-[40px]">
            {bulkLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Import CSV
              </>
            )}
          </button>
        </div>

        {bulkResult && (
          <div className={`rounded-xl border p-4 text-sm flex items-center gap-3 animate-fade-in ${
            bulkResult.failed === 0
              ? 'border-[var(--color-success)]'
              : 'border-[var(--color-warning)]'
          }`} style={{
            backgroundColor: bulkResult.failed === 0 ? 'var(--color-success-muted)' : 'var(--color-warning-muted)',
          }}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none"
              stroke={bulkResult.failed === 0 ? 'var(--color-success)' : 'var(--color-warning)'}
              strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong>{bulkResult.imported}</strong> students imported
              {bulkResult.failed > 0 && <> · <strong>{bulkResult.failed}</strong> rows failed</>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
