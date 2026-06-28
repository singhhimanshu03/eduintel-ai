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
      // Use Axios so the JWT Authorization header is sent automatically
      const response = await api.get(`/exams/hall-tickets/${userId}/pdf`, {
        responseType: 'blob',
      });
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

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Exam Cycle</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="e.g. Nov-2024" value={examCycle} onChange={e => setExamCycle(e.target.value)}
          />
        </div>
        <button onClick={handleGenerate} disabled={mutation.isPending || !examCycle}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
          {mutation.isPending ? '⏳ Checking eligibility…' : 'Check Eligibility & Generate'}
        </button>
      </div>

      {result && (
        <div className={`rounded-xl border p-5 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <div>
                  <p className="font-semibold text-green-800">You are eligible!</p>
                  <p className="text-sm text-green-700">Your hall ticket has been generated.</p>
                </div>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                {downloading ? '⏳ Preparing PDF…' : '📄 Download Hall Ticket PDF'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚫</span>
                <p className="font-semibold text-red-800">Not eligible for hall ticket</p>
              </div>
              <ul className="space-y-2">
                {(result.reasons ?? []).map((r, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✕</span> {r}
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
