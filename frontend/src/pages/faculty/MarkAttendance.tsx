import { useState } from 'react';
import { useCreateClass, useMarkAttendance } from '../../hooks/useAttendance';
import PageHeader from '../../components/ui/PageHeader';

export default function MarkAttendance() {
  const [step, setStep] = useState<'create' | 'mark'>('create');
  const [sessionId, setSessionId] = useState('');
  const [sessionForm, setSessionForm] = useState({ subjectCode: '', sessionDate: '', timeSlot: '', semester: '' });
  const [studentRows, setStudentRows] = useState([{ studentId: '', status: 'present' as 'present' | 'absent' }]);

  const createClass    = useCreateClass();
  const markAttendance = useMarkAttendance();

  const handleCreateSession = async () => {
    const res = await createClass.mutateAsync({
      subjectCode: sessionForm.subjectCode, sessionDate: sessionForm.sessionDate,
      timeSlot: sessionForm.timeSlot, semester: parseInt(sessionForm.semester),
    });
    setSessionId(res.data.classSessionId);
    setStep('mark');
  };

  const handleMarkAttendance = async () => {
    await markAttendance.mutateAsync({ sessionId, records: studentRows });
    alert('Attendance marked successfully!');
    setStep('create');
    setStudentRows([{ studentId: '', status: 'present' }]);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Attendance Management" subtitle="Create class sessions and mark attendance" />

      {step === 'create' && (
        <div className="card p-6 space-y-4 transition-colors duration-200">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Step 1: Create Class Session</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Subject Code', 'subjectCode', 'CS301'],
              ['Date',         'sessionDate', ''],
              ['Time Slot',    'timeSlot',    '09:00-10:00'],
              ['Semester',     'semester',    '3'],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
                <input type={key === 'sessionDate' ? 'date' : 'text'} className="input-base"
                  placeholder={placeholder}
                  value={(sessionForm as Record<string, string>)[key]}
                  onChange={e => setSessionForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={handleCreateSession} disabled={createClass.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm transition disabled:opacity-50">
            {createClass.isPending ? 'Creating…' : 'Create Session →'}
          </button>
        </div>
      )}

      {step === 'mark' && (
        <div className="card p-6 space-y-4 transition-colors duration-200">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">
            Step 2: Mark Attendance — Session{' '}
            <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs text-gray-800 dark:text-gray-200">
              {sessionId}
            </code>
          </h3>
          <div className="space-y-2">
            {studentRows.map((row, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input className="input-base flex-1" placeholder="Student ID"
                  value={row.studentId}
                  onChange={e => { const u = [...studentRows]; u[i].studentId = e.target.value; setStudentRows(u); }} />
                <select className="input-base w-32"
                  value={row.status}
                  onChange={e => { const u = [...studentRows]; u[i].status = e.target.value as 'present' | 'absent'; setStudentRows(u); }}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
                {i > 0 && (
                  <button onClick={() => setStudentRows(studentRows.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 text-sm">✕</button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStudentRows([...studentRows, { studentId: '', status: 'present' }])}
              className="border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300
                px-4 py-2 rounded-lg text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition">
              + Add Student
            </button>
            <button onClick={handleMarkAttendance} disabled={markAttendance.isPending}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm transition disabled:opacity-50">
              {markAttendance.isPending ? 'Submitting…' : '✓ Submit Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
