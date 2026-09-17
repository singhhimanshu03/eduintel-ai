import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../app/api';
import { useCompanies, useCreateDrive, useEligibleStudentsForDrive, useScheduleInterview } from '../../hooks/usePlacement';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Drive {
  id: string;
  company_id: string;
  company_name?: string;
  min_cgpa?: number;
  max_backlogs: number;
  graduation_year?: number;
  interview_date?: string;
  venue?: string;
  drive_status: 'active' | 'completed' | 'cancelled';
}

interface EligibleStudent {
  student_id: string;
  cgpa: number;
  backlog_count: number;
  readiness_score?: number;
}

export default function RecruitmentDrives() {
  const qc = useQueryClient();
  const { data: companies = [] } = useCompanies();
  const createDrive = useCreateDrive();

  const [driveForm, setDriveForm] = useState({
    companyId: '', minCgpa: '', maxBacklogs: '0',
    graduationYear: new Date().getFullYear().toString(),
    interviewDate: '', venue: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [interviewStudentId, setInterviewStudentId] = useState('');
  const scheduleInterview = useScheduleInterview();

  const { data: drives = [], isLoading } = useQuery<Drive[]>({
    queryKey: ['drives'],
    queryFn: () => api.get('/placement/drives').then(r => r.data.data ?? []),
  });

  const { data: eligible = [], isLoading: loadingEligible } = useEligibleStudentsForDrive(selectedDriveId);

  const handleCreateDrive = () => {
    createDrive.mutate({
      companyId: driveForm.companyId,
      minCgpa: parseFloat(driveForm.minCgpa) || 0,
      maxBacklogs: parseInt(driveForm.maxBacklogs) || 0,
      graduationYear: parseInt(driveForm.graduationYear),
      interviewDate: driveForm.interviewDate || undefined,
      venue: driveForm.venue || undefined,
    } as Parameters<typeof createDrive.mutate>[0]);
  };

  const handleSchedule = async () => {
    if (!selectedDriveId || !interviewStudentId) return;
    await scheduleInterview.mutateAsync({
      driveId: selectedDriveId,
      studentId: interviewStudentId,
      interviewDate: driveForm.interviewDate,
      interviewTime: '10:00',
      venue: driveForm.venue,
    } as Parameters<typeof scheduleInterview.mutateAsync>[0]);
    alert('Interview scheduled!');
    setInterviewStudentId('');
  };

  const driveColumns = [
    { header: 'Company',     accessor: (d: Drive) => d.company_name ?? d.company_id },
    { header: 'Min CGPA',    accessor: (d: Drive) => d.min_cgpa ?? '—' },
    { header: 'Max Backlogs',accessor: 'max_backlogs' as keyof Drive },
    { header: 'Grad Year',   accessor: (d: Drive) => d.graduation_year ?? '—' },
    { header: 'Interview',   accessor: (d: Drive) => d.interview_date?.split('T')[0] ?? '—' },
    { header: 'Status', accessor: (d: Drive) => {
      const cls = d.drive_status === 'active' ? 'badge-success' :
                  d.drive_status === 'completed' ? 'badge-neutral' : 'badge-danger';
      return <span className={`badge ${cls}`}>{d.drive_status}</span>;
    }},
    { header: 'Actions', accessor: (d: Drive) => (
      <button onClick={() => setSelectedDriveId(d.id)}
        className="text-xs font-semibold transition-colors hover:underline"
        style={{ color: 'var(--color-primary)' }}>
        View Eligible →
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment Drives" subtitle="Manage campus recruitment drives and interviews"
        action={
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg> Cancel</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg> New Drive</>
            )}
          </button>
        }
      />

      {/* Create drive form */}
      {showForm && (
        <div className="card p-5 animate-slide-down">
          <h3 className="text-sm font-heading font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Recruitment Drive
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Company *</label>
              <select className="input-base select-styled" value={driveForm.companyId}
                onChange={e => setDriveForm(f => ({ ...f, companyId: e.target.value }))}>
                <option value="">Select company…</option>
                {(companies as { id: string; company_name: string }[]).map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
            {[
              ['Min CGPA',      'minCgpa',       '6.5'],
              ['Max Backlogs',  'maxBacklogs',   '0'],
              ['Grad Year',     'graduationYear', '2025'],
              ['Interview Date','interviewDate', ''],
              ['Venue',         'venue',         'Auditorium'],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                <input type={key === 'interviewDate' ? 'date' : 'text'} className="input-base" placeholder={placeholder}
                  value={(driveForm as Record<string, string>)[key]}
                  onChange={e => setDriveForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={handleCreateDrive} disabled={createDrive.isPending || !driveForm.companyId} className="btn-primary mt-4">
            {createDrive.isPending ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg> Creating…</>
            ) : 'Create Drive'}
          </button>
        </div>
      )}

      {/* Drives table */}
      {isLoading ? <LoadingSpinner /> : (
        <Table columns={driveColumns} data={drives} keyField="id"
          emptyMessage="No drives created yet" emptyIcon="🚀"
          emptyAction={{ label: '+ New Drive', onClick: () => setShowForm(true) }} />
      )}

      {/* Eligible students panel */}
      {selectedDriveId && (
        <div className="card p-5 animate-fade-in-up" style={{ borderColor: 'var(--color-primary)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Eligible Students
            </h3>
            <button onClick={() => setSelectedDriveId('')} className="btn-icon">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {loadingEligible ? <LoadingSpinner /> : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {(eligible as EligibleStudent[]).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--color-elevated)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                        {s.student_id.slice(-2)}
                      </div>
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text-base)' }}>{s.student_id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span>CGPA: <strong style={{ color: 'var(--color-text-base)' }}>{s.cgpa}</strong></span>
                      <span>Backlogs: <strong style={{ color: 'var(--color-text-base)' }}>{s.backlog_count}</strong></span>
                      {s.readiness_score && <span>Readiness: <strong style={{ color: 'var(--color-primary)' }}>{s.readiness_score}</strong></span>}
                      <button onClick={() => setInterviewStudentId(s.student_id)} className="btn-primary text-xs py-1 px-3">
                        Schedule
                      </button>
                    </div>
                  </div>
                ))}
                {eligible.length === 0 && (
                  <div className="text-center py-8 animate-fade-in">
                    <div className="text-2xl mb-2 opacity-40">🔍</div>
                    <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>No eligible students found for this drive criteria.</p>
                  </div>
                )}
              </div>

              {interviewStudentId && (
                <div className="flex items-center gap-3 p-3 rounded-xl animate-scale-in"
                  style={{ backgroundColor: 'var(--color-primary-muted)', border: '1px solid var(--color-primary)' }}>
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-primary)' }}>
                    Schedule interview for: <strong>{interviewStudentId}</strong>
                  </span>
                  <button onClick={handleSchedule} disabled={scheduleInterview.isPending} className="btn-success text-xs py-1.5">
                    {scheduleInterview.isPending ? '⏳ Scheduling…' : '✓ Confirm'}
                  </button>
                  <button onClick={() => setInterviewStudentId('')} className="btn-icon" style={{ color: 'var(--color-text-faint)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
