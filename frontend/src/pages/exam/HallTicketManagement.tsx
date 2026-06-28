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

      <div className="card p-5 flex gap-3 items-end flex-wrap transition-colors duration-200">
        {[
          { label: 'Student ID', key: 'studentId', val: studentId, set: setStudentId, ph: 'UUID' },
          { label: 'Exam Cycle', key: 'examCycle', val: examCycle, set: setExamCycle, ph: 'Nov-2024' },
        ].map(({ label, key, val, set, ph }) => (
          <div key={key} className="flex-1 min-w-[180px]">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
            <input className="input-base" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
          </div>
        ))}
        <button onClick={handleGenerate} disabled={mutation.isPending || !studentId || !examCycle}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm transition disabled:opacity-50 h-[42px]">
          {mutation.isPending ? '⏳ Checking…' : 'Generate'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Results</h3>
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl border p-4 transition-colors duration-200 ${
              r.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40'
                : 'bg-red-50  dark:bg-red-900/20  border-red-200  dark:border-red-700/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-800 dark:text-white">{r.studentId}</span>
                <span className={`text-xs font-bold ${r.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {r.success ? '✓ ELIGIBLE' : '✗ BLOCKED'}
                </span>
              </div>
              {!r.success && r.reasons && (
                <ul className="mt-2 space-y-1">
                  {r.reasons.map((reason, j) => (
                    <li key={j} className="text-xs text-red-600 dark:text-red-400 flex gap-1.5">
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
