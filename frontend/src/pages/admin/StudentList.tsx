import { useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks/useStudents';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Student {
  id: string; student_code: string; full_name: string;
  email: string; enrollment_status: string; current_semester: number;
}

export default function StudentList() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useStudents();

  const columns = [
    { header: 'Code',     accessor: 'student_code' as keyof Student, sortable: true },
    { header: 'Name',     accessor: 'full_name'    as keyof Student, sortable: true },
    { header: 'Email',    accessor: 'email'        as keyof Student, sortable: true },
    { header: 'Semester', accessor: 'current_semester' as keyof Student, sortable: true },
    { header: 'Status', accessor: (s: Student) => (
      <span className={`badge ${
        s.enrollment_status === 'active' ? 'badge-success' : 'badge-neutral'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          s.enrollment_status === 'active' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-faint)]'
        }`} />
        {s.enrollment_status}
      </span>
    )},
    { header: 'Actions', accessor: (s: Student) => (
      <button onClick={() => navigate(`/admin/students/${s.id}`)}
        className="btn-ghost text-xs py-1.5 px-3 gap-1.5" style={{ color: 'var(--color-primary)' }}>
        View
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        subtitle={`${(data as Student[]).length} enrolled students`}
        action={
          <button onClick={() => navigate('/admin/students/new')} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Student
          </button>
        }
      />
      {isLoading ? <LoadingSpinner /> : (
        <Table
          columns={columns}
          data={data as Student[]}
          keyField="id"
          emptyMessage="No students found"
          emptyIcon="🎓"
          emptyAction={{ label: '+ Add First Student', onClick: () => navigate('/admin/students/new') }}
          searchable
          searchPlaceholder="Search by name, code, or email…"
          pageSize={10}
        />
      )}
    </div>
  );
}
