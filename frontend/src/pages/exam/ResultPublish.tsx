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
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Semester</label>
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="3" value={semester} onChange={e => setSemester(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Academic Year</label>
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
        </div>
        <button onClick={handlePublish} disabled={mutation.isPending || !semester}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
          {mutation.isPending ? '⏳ Publishing…' : '📢 Publish Results'}
        </button>
        {published && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            ✓ Semester {semester} results published. All students have been notified.
          </div>
        )}
        {mutation.isError && (
          <p className="text-red-500 text-sm">Failed to publish. Please try again.</p>
        )}
      </div>
    </div>
  );
}
