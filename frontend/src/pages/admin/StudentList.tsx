import { useState } from 'react';
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
  const [search, setSearch] = useState('');
  const { data = [], isLoading } = useStudents();

  const filtered = (data as Student[]).filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Code',     accessor: 'student_code' as keyof Student },
    { header: 'Name',     accessor: 'full_name'    as keyof Student },
    { header: 'Email',    accessor: 'email'        as keyof Student },
    { header: 'Semester', accessor: 'current_semester' as keyof Student },
    { header: 'Status', accessor: (s: Student) => (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        s.enrollment_status === 'active'
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}>{s.enrollment_status}</span>
    )},
    { header: 'Actions', accessor: (s: Student) => (
      <button onClick={() => navigate(`/admin/students/${s.id}`)}
        className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-medium">
        View →
      </button>
    )},
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        subtitle={`${(data as Student[]).length} enrolled students`}
        action={
          <button onClick={() => navigate('/admin/students/new')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition">
            + Add Student
          </button>
        }
      />
      <input type="text" placeholder="Search by name, code, or email…"
        value={search} onChange={e => setSearch(e.target.value)}
        className="input-base max-w-sm"
      />
      {isLoading ? <LoadingSpinner /> : (
        <Table columns={columns} data={filtered} keyField="id" emptyMessage="No students found." />
      )}
    </div>
  );
}
