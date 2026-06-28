import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Company {
  id: string; company_name: string; industry: string;
  ctc_min: number; ctc_max: number; role: string; is_active: boolean;
}

export default function CompanyManagement() {
  const qc = useQueryClient();
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/placement/companies').then(r => r.data.data),
  });
  const [form, setForm] = useState({ companyName: '', industry: '', ctcMin: '', ctcMax: '', role: '' });

  const createCompany = useMutation({
    mutationFn: () => api.post('/placement/companies', {
      companyName: form.companyName, industry: form.industry,
      ctcMin: parseFloat(form.ctcMin), ctcMax: parseFloat(form.ctcMax), role: form.role,
    }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setForm({ companyName: '', industry: '', ctcMin: '', ctcMax: '', role: '' }); },
  });

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400';

  const columns = [
    { header: 'Company',  accessor: 'company_name' as keyof Company },
    { header: 'Industry', accessor: 'industry' as keyof Company },
    { header: 'Role',     accessor: 'role' as keyof Company },
    { header: 'CTC Range', accessor: (c: Company) => `₹${c.ctc_min}L – ₹${c.ctc_max}L` },
    { header: 'Status', accessor: (c: Company) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {c.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Company Management" subtitle="Manage recruiting companies and drives" />

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">+ Add Company</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            ['Company Name', 'companyName', 'TCS'],
            ['Industry',     'industry',    'IT Services'],
            ['Role',         'role',        'Software Engineer'],
            ['CTC Min (L)',  'ctcMin',      '4'],
            ['CTC Max (L)',  'ctcMax',      '8'],
          ].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input className={inputCls} placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button onClick={() => createCompany.mutate()} disabled={createCompany.isPending}
          className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
          {createCompany.isPending ? 'Adding…' : 'Add Company'}
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : <Table columns={columns} data={companies as Company[]} keyField="id" emptyMessage="No companies added yet." />}
    </div>
  );
}
