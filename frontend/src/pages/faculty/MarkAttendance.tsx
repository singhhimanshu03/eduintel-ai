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

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
          step === 'create' ? '' : ''
        }`} style={{
          backgroundColor: step === 'create' ? 'var(--color-primary-muted)' : 'var(--color-elevated)',
          color: step === 'create' ? 'var(--color-primary)' : 'var(--color-text-faint)',
        }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: step === 'create' ? 'var(--gradient-primary)' : 'var(--color-text-faint)' }}>1</span>
          Create Session
        </div>
        <svg className="w-4 h-4" fill="none" stroke="var(--color-text-faint)" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{
          backgroundColor: step === 'mark' ? 'var(--color-success-muted)' : 'var(--color-elevated)',
          color: step === 'mark' ? 'var(--color-success)' : 'var(--color-text-faint)',
        }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: step === 'mark' ? 'var(--gradient-success)' : 'var(--color-text-faint)' }}>2</span>
          Mark Attendance
        </div>
      </div>

      {step === 'create' && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>Create Class Session</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Subject Code', 'subjectCode', 'CS301'],
              ['Date',         'sessionDate', ''],
              ['Time Slot',    'timeSlot',    '09:00-10:00'],
              ['Semester',     'semester',    '3'],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                <input type={key === 'sessionDate' ? 'date' : 'text'} className="input-base"
                  placeholder={placeholder}
                  value={(sessionForm as Record<string, string>)[key]}
                  onChange={e => setSessionForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={handleCreateSession} disabled={createClass.isPending} className="btn-primary">
            {createClass.isPending ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg> Creating…</>
            ) : (
              <>Create Session
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg></>
            )}
          </button>
        </div>
      )}

      {step === 'mark' && (
        <div className="card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>Mark Attendance</h3>
            <code className="text-[10px] px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-elevated)', color: 'var(--color-text-muted)' }}>
              Session: {sessionId}
            </code>
          </div>
          <div className="space-y-2">
            {studentRows.map((row, i) => (
              <div key={i} className="flex gap-3 items-center p-2 rounded-xl" style={{ backgroundColor: 'var(--color-elevated)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>{i + 1}</span>
                <input className="input-base flex-1" placeholder="Student ID"
                  value={row.studentId}
                  onChange={e => { const u = [...studentRows]; u[i].studentId = e.target.value; setStudentRows(u); }} />
                <select className="input-base select-styled w-32"
                  value={row.status}
                  onChange={e => { const u = [...studentRows]; u[i].status = e.target.value as 'present' | 'absent'; setStudentRows(u); }}>
                  <option value="present">✓ Present</option>
                  <option value="absent">✗ Absent</option>
                </select>
                {i > 0 && (
                  <button onClick={() => setStudentRows(studentRows.filter((_, j) => j !== i))}
                    className="btn-icon" style={{ color: 'var(--color-danger)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStudentRows([...studentRows, { studentId: '', status: 'present' }])}
              className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Student
            </button>
            <button onClick={handleMarkAttendance} disabled={markAttendance.isPending} className="btn-success">
              {markAttendance.isPending ? '⏳ Submitting…' : '✓ Submit Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
