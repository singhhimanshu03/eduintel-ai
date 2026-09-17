import { useQuery } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Table from '../../components/ui/Table';
import FeeCollectionChart from '../../components/charts/FeeCollectionChart';

interface FeeRecord {
  student_id: string; total_fee: number; paid_amount: number;
  balance: number; fee_status: string; last_payment_date: string;
}

export default function FeeDefaulters() {
  const { data: defaulters = [], isLoading } = useQuery<FeeRecord[]>({
    queryKey: ['fee-defaulters'],
    queryFn: () => api.get('/fees/defaulters').then(r => r.data.data),
  });
  const { data: analytics } = useQuery({
    queryKey: ['fee-analytics'],
    queryFn: () => api.get('/fees/analytics').then(r => r.data.data),
  });

  const columns = [
    { header: 'Student ID',   accessor: 'student_id' as keyof FeeRecord, sortable: true },
    { header: 'Total Fee',    accessor: (r: FeeRecord) => (
      <span style={{ color: 'var(--color-text-base)' }}>₹{Number(r.total_fee).toLocaleString()}</span>
    )},
    { header: 'Paid',         accessor: (r: FeeRecord) => (
      <span style={{ color: 'var(--color-success)' }}>₹{Number(r.paid_amount).toLocaleString()}</span>
    )},
    { header: 'Balance',      accessor: (r: FeeRecord) => (
      <span className="font-semibold" style={{ color: 'var(--color-danger)' }}>₹{Number(r.balance).toLocaleString()}</span>
    )},
    { header: 'Status', accessor: (r: FeeRecord) => {
      const cls = r.fee_status === 'paid' ? 'badge-success' :
                  r.fee_status === 'partially_paid' ? 'badge-warning' : 'badge-danger';
      return <span className={`badge ${cls}`}>{r.fee_status.replace('_', ' ')}</span>;
    }},
    { header: 'Last Payment', accessor: (r: FeeRecord) => (
      <span style={{ color: 'var(--color-text-muted)' }}>
        {r.last_payment_date ? r.last_payment_date.split('T')[0] : '—'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Fee Management" subtitle="Outstanding dues and defaulter report" />
      {analytics?.dailyCollection && (
        <div className="animate-fade-in-up">
          <FeeCollectionChart data={analytics.dailyCollection} />
        </div>
      )}
      {isLoading ? <LoadingSpinner /> : (
        <div className="animate-fade-in-up stagger-2">
          <Table
            columns={columns}
            data={defaulters as FeeRecord[]}
            keyField="student_id"
            emptyMessage="No defaulters — all fees collected!"
            emptyIcon="🎉"
            searchable
            searchPlaceholder="Search by student ID…"
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
}
