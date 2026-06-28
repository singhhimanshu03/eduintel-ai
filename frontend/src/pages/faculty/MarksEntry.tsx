import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';

export default function MarksEntry() {
  const [form, setForm] = useState({
    studentId: '', subjectCode: '', semester: '',
    academicYear: new Date().getFullYear().toString(),
    internalMarks: '', semesterMarks: '',
  });
  const [result, setResult] = useState<{ grade?: string; gpa_points?: number; is_backlog?: boolean } | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/exams/marks', {
      studentId: form.studentId, subjectCode: form.subjectCode,
      semester: parseInt(form.semester), academicYear: form.academicYear,
      internalMarks: parseFloat(form.internalMarks), semesterMarks: parseFloat(form.semesterMarks),
    }).then(r => r.data.data),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Marks Entry" subtitle="Enter internal and semester examination marks" />
      <div className="card p-6 space-y-4 transition-colors duration-200">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Student ID',    'studentId',    'STU001'],
            ['Subject Code',  'subjectCode',  'CS301'],
            ['Semester',      'semester',     '3'],
            ['Academic Year', 'academicYear', '2024'],
            ['Internal Marks','internalMarks','40'],
            ['Semester Marks','semesterMarks','60'],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
              <input className="input-base" placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm transition disabled:opacity-50">
          {mutation.isPending ? 'Saving…' : 'Save Marks'}
        </button>
        {mutation.isError && (
          <p className="text-red-500 dark:text-red-400 text-sm">
            {String((mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save marks')}
          </p>
        )}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.is_backlog
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40'
          }`}>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              Grade: <span className="text-lg">{result.grade}</span> | GPA Points: {result.gpa_points}
            </p>
            {result.is_backlog && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">⚠️ Backlog — student has failed this subject</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
