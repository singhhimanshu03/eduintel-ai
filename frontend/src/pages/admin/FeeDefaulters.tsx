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

  const statusCls = (s: string) =>
    s === 'paid'           ? 'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300'  :
    s === 'partially_paid' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                             'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-300';

  const columns = [
    { header: 'Student ID',   accessor: 'student_id' as keyof FeeRecord },
    { header: 'Total Fee',    accessor: (r: FeeRecord) => `₹${Number(r.total_fee).toLocaleString()}` },
    { header: 'Paid',         accessor: (r: FeeRecord) => `₹${Number(r.paid_amount).toLocaleString()}` },
    { header: 'Balance',      accessor: (r: FeeRecord) => (
      <span className="text-red-600 dark:text-red-400 font-semibold">₹{Number(r.balance).toLocaleString()}</span>
    )},
    { header: 'Status', accessor: (r: FeeRecord) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls(r.fee_status)}`}>
        {r.fee_status.replace('_', ' ')}
      </span>
    )},
    { header: 'Last Payment', accessor: (r: FeeRecord) => r.last_payment_date ? r.last_payment_date.split('T')[0] : '—' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Fee Management" subtitle="Outstanding dues and defaulter report" />
      {analytics?.dailyCollection && <FeeCollectionChart data={analytics.dailyCollection} />}
      {isLoading ? <LoadingSpinner /> : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">{(defaulters as FeeRecord[]).length} students with pending dues</p>
          <Table columns={columns} data={defaulters as FeeRecord[]} keyField="student_id" emptyMessage="No defaulters — all fees collected!" />
        </>
      )}
    </div>
  );
}
