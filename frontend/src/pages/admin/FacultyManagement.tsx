import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

interface Faculty {
  id: string;
  faculty_code: string;
  full_name: string;
  email: string;
  designation: string;
  employment_status: string;
}

export default function FacultyManagement() {
  const institutionId = useSelector((s: RootState) => s.auth.institutionId);
  const qc = useQueryClient();

  const { data: faculty = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ['admin-faculty'],
    queryFn: () => api.get('/faculty').then(r => r.data.data ?? []),
  });

  const [form, setForm] = useState({
    facultyCode: '', fullName: '', email: '',
    designation: 'Assistant Professor', phone: '',
  });
  const [showForm, setShowForm] = useState(false);

  const createFaculty = useMutation({
    mutationFn: () => api.post('/faculty', {
      ...form,
      institutionId: institutionId ?? '',
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-faculty'] });
      setForm({ facultyCode: '', fullName: '', email: '', designation: 'Assistant Professor', phone: '' });
      setShowForm(false);
    },
  });

  const columns = [
    { header: 'Code',        accessor: 'faculty_code' as keyof Faculty },
    { header: 'Name',        accessor: 'full_name' as keyof Faculty },
    { header: 'Email',       accessor: 'email' as keyof Faculty },
    { header: 'Designation', accessor: 'designation' as keyof Faculty },
    { header: 'Status', accessor: (f: Faculty) => (
      <span className={`badge ${f.employment_status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
        {f.employment_status}
      </span>
    )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Faculty Management"
        subtitle={`${(faculty as Faculty[]).length} faculty members`}
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '✕ Cancel' : '+ Add Faculty'}
          </button>
        }
      />

      {showForm && (
        <div className="card p-5 space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>
            New Faculty Member
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Faculty Code', 'facultyCode', 'FAC004'],
              ['Full Name',    'fullName',    'Dr. Jane Smith'],
              ['Email',        'email',       'jane@faculty.edu'],
              ['Phone',        'phone',       '+91 9876543210'],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </label>
                <input className="input-base" placeholder={ph}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                Designation
              </label>
              <select className="input-base"
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>
                <option>Professor</option>
                <option>Associate Professor</option>
                <option>Assistant Professor</option>
                <option>Lecturer</option>
              </select>
            </div>
          </div>
          {createFaculty.isError && (
            <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
              Failed to create faculty. Check all fields.
            </p>
          )}
          <button
            onClick={() => createFaculty.mutate()}
            disabled={createFaculty.isPending || !form.facultyCode || !form.fullName || !form.email}
            className="btn-primary">
            {createFaculty.isPending ? '⏳ Creating…' : 'Create Faculty'}
          </button>
        </div>
      )}

      {isLoading
        ? <LoadingSpinner />
        : <Table columns={columns} data={faculty as Faculty[]} keyField="id" emptyMessage="No faculty added yet." />
      }
    </div>
  );
}
