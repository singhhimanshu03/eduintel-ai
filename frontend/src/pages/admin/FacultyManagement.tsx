import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Faculty {
  id: string; faculty_code: string; full_name: string;
  email: string; designation: string; employment_status: string;
}

export default function FacultyManagement() {
  const navigate = useNavigate();

  const { data: faculty = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ['admin-faculty'],
    queryFn: () => api.get('/faculty').then(r => r.data.data ?? []),
  });

  const columns = [
    { header: 'Code',        accessor: 'faculty_code' as keyof Faculty, sortable: true },
    { header: 'Name',        accessor: 'full_name' as keyof Faculty, sortable: true },
    { header: 'Email',       accessor: 'email' as keyof Faculty, sortable: true },
    { header: 'Designation', accessor: 'designation' as keyof Faculty, sortable: true },
    { header: 'Status', accessor: (f: Faculty) => (
      <span className={`badge ${f.employment_status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${f.employment_status === 'active' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-faint)]'}`} />
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
          <button onClick={() => navigate('/admin/users/new?role=faculty')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Faculty
          </button>
        }
      />

      {isLoading ? <LoadingSpinner /> : (
        <Table
          columns={columns}
          data={faculty as Faculty[]}
          keyField="id"
          emptyMessage="No faculty added yet"
          emptyIcon="👨‍🏫"
          emptyAction={{ label: '+ Add Faculty', onClick: () => navigate('/admin/users/new?role=faculty') }}
          searchable
          searchPlaceholder="Search by name, code, or email…"
        />
      )}
    </div>
  );
}
