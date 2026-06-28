import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../app/api';
import { useExamSchedules } from '../../hooks/useExams';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Table from '../../components/ui/Table';

interface Schedule {
  id: string; subject_code: string; exam_date: string;
  start_time: string; venue: string; semester: number; is_published: boolean;
}

export default function ExamOverview() {
  const { data: schedules = [], isLoading } = useExamSchedules();
  const [form, setForm] = useState({
    subjectCode: '', examDate: '', startTime: '', venue: '', durationMinutes: '120', semester: '',
  });

  const createSchedule = useMutation({
    mutationFn: () => api.post('/exams/schedules', {
      subjectCode: form.subjectCode, examDate: form.examDate, startTime: form.startTime,
      venue: form.venue, durationMinutes: parseInt(form.durationMinutes), semester: parseInt(form.semester),
    }).then(r => r.data),
  });

  const columns = [
    { header: 'Subject',  accessor: 'subject_code' as keyof Schedule },
    { header: 'Date',     accessor: (s: Schedule) => s.exam_date?.split('T')[0] },
    { header: 'Time',     accessor: 'start_time' as keyof Schedule },
    { header: 'Venue',    accessor: 'venue' as keyof Schedule },
    { header: 'Semester', accessor: 'semester' as keyof Schedule },
    { header: 'Status', accessor: (s: Schedule) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        s.is_published
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
      }`}>{s.is_published ? 'Published' : 'Draft'}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Exam Schedules" subtitle="Create and manage examination timetables" />

      <div className="card p-5 transition-colors duration-200">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">+ New Exam Schedule</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            ['Subject Code',    'subjectCode',     'CS301'],
            ['Exam Date',       'examDate',        ''],
            ['Start Time',      'startTime',       '10:00'],
            ['Venue',           'venue',           'Hall A'],
            ['Duration (mins)', 'durationMinutes', '120'],
            ['Semester',        'semester',        '3'],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
              <input type={key === 'examDate' ? 'date' : 'text'} className="input-base"
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button onClick={() => createSchedule.mutate()} disabled={createSchedule.isPending}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm transition disabled:opacity-50">
          {createSchedule.isPending ? 'Creating…' : 'Create Schedule'}
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <Table columns={columns} data={schedules as Schedule[]} keyField="id" />
      )}
    </div>
  );
}
