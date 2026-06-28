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

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

export default function RecruitmentDrives() {
  const qc = useQueryClient();
  const { data: companies = [] } = useCompanies();
  const createDrive = useCreateDrive();

  const [driveForm, setDriveForm] = useState({
    companyId: '', minCgpa: '', maxBacklogs: '0',
    graduationYear: new Date().getFullYear().toString(),
    interviewDate: '', venue: '',
  });

  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [interviewStudentId, setInterviewStudentId] = useState('');
  const scheduleInterview = useScheduleInterview();

  // Fetch all drives
  const { data: drives = [], isLoading } = useQuery<Drive[]>({
    queryKey: ['drives'],
    queryFn: () => api.get('/placement/drives').then(r => r.data.data ?? []),
  });

  // Fetch eligible students for selected drive
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
    { header: 'Status', accessor: (d: Drive) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        d.drive_status === 'active'    ? 'bg-green-100 text-green-700' :
        d.drive_status === 'completed' ? 'bg-gray-100 text-gray-600' :
        'bg-red-100 text-red-700'
      }`}>{d.drive_status}</span>
    )},
    { header: 'Actions', accessor: (d: Drive) => (
      <button onClick={() => setSelectedDriveId(d.id)}
        className="text-indigo-600 hover:underline text-xs font-medium">
        View Eligible →
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment Drives" subtitle="Manage campus recruitment drives and interviews" />

      {/* Create drive form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm">+ Create Recruitment Drive</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Company *</label>
            <select className={inputCls} value={driveForm.companyId}
              onChange={e => setDriveForm(f => ({ ...f, companyId: e.target.value }))}>
              <option value="">Select company…</option>
              {(companies as { id: string; company_name: string }[]).map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          {[
            ['Min CGPA',     'minCgpa',       '6.5'],
            ['Max Backlogs', 'maxBacklogs',   '0'],
            ['Grad Year',    'graduationYear','2025'],
            ['Interview Date','interviewDate',''],
            ['Venue',        'venue',         'Auditorium'],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input
                type={key === 'interviewDate' ? 'date' : 'text'}
                className={inputCls}
                placeholder={placeholder}
                value={(driveForm as Record<string, string>)[key]}
                onChange={e => setDriveForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button onClick={handleCreateDrive} disabled={createDrive.isPending || !driveForm.companyId}
          className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
          {createDrive.isPending ? 'Creating…' : 'Create Drive'}
        </button>
      </div>

      {/* Drives table */}
      {isLoading ? <LoadingSpinner /> : (
        <Table columns={driveColumns} data={drives} keyField="id" emptyMessage="No drives created yet." />
      )}

      {/* Eligible students panel */}
      {selectedDriveId && (
        <div className="bg-white rounded-xl border border-indigo-200 p-5">
          <h3 className="font-semibold text-indigo-700 mb-4">Eligible Students for Drive</h3>
          {loadingEligible ? <LoadingSpinner /> : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {(eligible as EligibleStudent[]).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{s.student_id}</span>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>CGPA: <strong className="text-gray-800">{s.cgpa}</strong></span>
                      <span>Backlogs: <strong className="text-gray-800">{s.backlog_count}</strong></span>
                      {s.readiness_score && <span>Readiness: <strong className="text-indigo-700">{s.readiness_score}</strong></span>}
                    </div>
                    <button onClick={() => setInterviewStudentId(s.student_id)}
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700">
                      Schedule
                    </button>
                  </div>
                ))}
                {eligible.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No eligible students found for this drive criteria.</p>}
              </div>

              {interviewStudentId && (
                <div className="flex items-center gap-3 bg-indigo-50 rounded-lg p-3">
                  <span className="text-sm text-indigo-800 font-medium flex-1">Schedule interview for: <strong>{interviewStudentId}</strong></span>
                  <button onClick={handleSchedule} disabled={scheduleInterview.isPending}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-green-700 disabled:opacity-50">
                    {scheduleInterview.isPending ? 'Scheduling…' : '✓ Confirm'}
                  </button>
                  <button onClick={() => setInterviewStudentId('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
