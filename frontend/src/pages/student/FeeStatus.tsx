import { useAuth } from '../../hooks/useAuth';
import { useFeeStatus } from '../../hooks/useFees';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_STYLES: Record<string, string> = {
  paid:            'bg-green-50 border-green-200 text-green-800',
  partially_paid:  'bg-yellow-50 border-yellow-200 text-yellow-800',
  unpaid:          'bg-red-50 border-red-200 text-red-800',
};

const STATUS_ICONS: Record<string, string> = {
  paid: '✅', partially_paid: '⚠️', unpaid: '❌',
};

export default function FeeStatus() {
  const { userId } = useAuth();
  const { data: fee, isLoading } = useFeeStatus(userId ?? '');

  if (isLoading) return <LoadingSpinner message="Loading fee status…" />;

  const status: string = fee?.fee_status ?? 'unpaid';
  const pct = fee?.total_fee ? Math.min(100, Math.round(((fee.paid_amount ?? 0) / fee.total_fee) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Fee Status" subtitle="Your current fee payment status" />

      {/* Status card */}
      <div className={`rounded-xl border p-6 ${STATUS_STYLES[status] ?? STATUS_STYLES.unpaid}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{STATUS_ICONS[status] ?? '❓'}</span>
          <div>
            <p className="text-xs font-medium opacity-70">Payment Status</p>
            <p className="text-xl font-bold capitalize">{status.replace('_', ' ')}</p>
          </div>
        </div>

        {fee ? (
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Total Fee',    value: `₹${Number(fee.total_fee ?? 0).toLocaleString()}` },
              { label: 'Amount Paid', value: `₹${Number(fee.paid_amount ?? 0).toLocaleString()}` },
              { label: 'Balance Due', value: `₹${Number(fee.balance ?? 0).toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs opacity-70">{label}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-70">No fee record found. Please contact the admin.</p>
        )}
      </div>

      {/* Progress bar */}
      {fee && fee.total_fee > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Payment Progress</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {fee.last_payment_date && (
            <p className="text-xs text-gray-400 mt-2">
              Last payment: {new Date(fee.last_payment_date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Hall ticket eligibility notice */}
      <div className={`rounded-xl border p-4 text-sm ${
        status === 'paid' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <p className="font-semibold mb-1">
          {status === 'paid' ? '✅ Hall Ticket Eligible (Fee)' : '🚫 Hall Ticket Blocked (Fee Unpaid)'}
        </p>
        <p className="text-xs">
          {status === 'paid'
            ? 'Your fee status satisfies the hall ticket requirement.'
            : 'Clear your outstanding dues to unlock hall ticket generation.'}
        </p>
      </div>

      {/* Contact info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-1">💡 Having issues with your fee record?</p>
        <p className="text-xs">Contact the accounts department or raise a query with your college admin. Bring your payment receipts for verification.</p>
      </div>
    </div>
  );
}
