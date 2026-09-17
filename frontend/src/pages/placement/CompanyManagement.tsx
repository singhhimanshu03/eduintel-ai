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
  const [showForm, setShowForm] = useState(false);

  const createCompany = useMutation({
    mutationFn: () => api.post('/placement/companies', {
      companyName: form.companyName, industry: form.industry,
      ctcMin: parseFloat(form.ctcMin), ctcMax: parseFloat(form.ctcMax), role: form.role,
    }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setForm({ companyName: '', industry: '', ctcMin: '', ctcMax: '', role: '' }); setShowForm(false); },
  });

  const columns = [
    { header: 'Company',  accessor: 'company_name' as keyof Company, sortable: true },
    { header: 'Industry', accessor: 'industry' as keyof Company, sortable: true },
    { header: 'Role',     accessor: 'role' as keyof Company },
    { header: 'CTC Range', accessor: (c: Company) => (
      <span style={{ color: 'var(--color-text-base)' }}>₹{c.ctc_min}L – ₹{c.ctc_max}L</span>
    )},
    { header: 'Status', accessor: (c: Company) => (
      <span className={`badge ${c.is_active ? 'badge-success' : 'badge-neutral'}`}>
        {c.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Company Management" subtitle="Manage recruiting companies and drives"
        action={
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg> Cancel</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg> Add Company</>
            )}
          </button>
        }
      />

      {showForm && (
        <div className="card p-5 animate-slide-down">
          <h3 className="text-sm font-heading font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
            New Company
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Company Name', 'companyName', 'TCS'],
              ['Industry',     'industry',    'IT Services'],
              ['Role',         'role',        'Software Engineer'],
              ['CTC Min (L)',  'ctcMin',      '4'],
              ['CTC Max (L)',  'ctcMax',      '8'],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                <input className="input-base" placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={() => createCompany.mutate()} disabled={createCompany.isPending || !form.companyName}
            className="btn-primary mt-4">
            {createCompany.isPending ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg> Adding…</>
            ) : 'Add Company'}
          </button>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <Table columns={columns} data={companies as Company[]} keyField="id"
          emptyMessage="No companies added yet" emptyIcon="🏢"
          emptyAction={{ label: '+ Add Company', onClick: () => setShowForm(true) }}
          searchable searchPlaceholder="Search companies…" />
      )}
    </div>
  );
}
