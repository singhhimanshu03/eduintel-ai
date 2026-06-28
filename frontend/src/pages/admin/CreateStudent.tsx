import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateStudent } from '../../hooks/useStudents';
import PageHeader from '../../components/ui/PageHeader';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

const schema = z.object({
  studentCode:     z.string().min(1, 'Student code is required'),
  fullName:        z.string().min(2, 'Full name is required'),
  email:           z.string().email('Valid email required'),
  phone:           z.string().optional(),
  gender:          z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth:     z.string().optional(),
  currentSemester: z.coerce.number().int().min(1).max(12).optional(),
  departmentId:    z.string().optional(),
  courseId:        z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

export default function CreateStudent() {
  const navigate = useNavigate();
  const institutionId = useSelector((s: RootState) => (s.auth as unknown as { institutionId?: string }).institutionId);
  const createStudent = useCreateStudent();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ imported: number; failed: number } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await createStudent.mutateAsync({
      ...data,
      institutionId: (institutionId as string) ?? '',
    });
    navigate('/admin/students');
  };

  const handleBulkImport = async () => {
    if (!csvFile) return;
    setBulkLoading(true);
    const form = new FormData();
    form.append('file', csvFile);
    try {
      const res = await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth') ?? '{}').accessToken}` },
        body: form,
      });
      const json = await res.json();
      setBulkResult({ imported: json.data?.imported ?? 0, failed: json.data?.failed ?? 0 });
    } catch {
      alert('Bulk import failed. Check your CSV format.');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Add Student"
        subtitle="Create a new student record or bulk import via CSV"
        action={
          <button onClick={() => navigate('/admin/students')}
            className="text-sm text-gray-500 hover:text-gray-700">← Back to list</button>
        }
      />

      {/* ── Single student form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-700 text-sm">Student Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Student Code *', key: 'studentCode', placeholder: 'CS2024001' },
            { label: 'Full Name *',    key: 'fullName',    placeholder: 'Riya Sharma' },
            { label: 'Email *',        key: 'email',       placeholder: 'riya@college.edu' },
            { label: 'Phone',          key: 'phone',       placeholder: '+91 9876543210' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input {...register(key as keyof FormData)} placeholder={placeholder} className={inputCls} />
              {errors[key as keyof FormData] && (
                <p className="text-red-500 text-xs mt-1">{errors[key as keyof FormData]?.message as string}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
            <select {...register('gender')} className={inputCls}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
            <input type="date" {...register('dateOfBirth')} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Semester</label>
            <input type="number" min={1} max={12} {...register('currentSemester')} className={inputCls} placeholder="1" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department ID <span className="text-gray-400">(UUID, optional)</span></label>
            <input {...register('departmentId')} className={inputCls} placeholder="uuid" />
          </div>
        </div>

        {createStudent.isError && (
          <p className="text-red-500 text-sm">
            {(createStudent.error as Error)?.message ?? 'Failed to create student'}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={createStudent.isPending}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
            {createStudent.isPending ? 'Creating…' : 'Create Student'}
          </button>
          <button type="button" onClick={() => reset()}
            className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50">
            Reset
          </button>
        </div>
      </form>

      {/* ── Bulk import ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Bulk Import via CSV</h3>
        <p className="text-xs text-gray-500">
          CSV columns: <code className="bg-gray-100 px-1.5 py-0.5 rounded">student_code, full_name, email, phone, gender, current_semester</code>
        </p>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={e => setCsvFile(e.target.files?.[0] ?? null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700"
            />
          </div>
          <button
            onClick={handleBulkImport}
            disabled={!csvFile || bulkLoading}
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 h-[38px]">
            {bulkLoading ? '⏳ Importing…' : '📤 Import CSV'}
          </button>
        </div>

        {bulkResult && (
          <div className={`rounded-lg border p-3 text-sm ${bulkResult.failed === 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
            ✓ Imported: <strong>{bulkResult.imported}</strong> students
            {bulkResult.failed > 0 && <> · ✗ Failed: <strong>{bulkResult.failed}</strong> rows (check duplicates / missing fields)</>}
          </div>
        )}
      </div>
    </div>
  );
}
