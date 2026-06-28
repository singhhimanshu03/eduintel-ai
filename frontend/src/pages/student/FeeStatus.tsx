import { useAuth } from '../../hooks/useAuth';
import { useFeeStatus } from '../../hooks/useFees';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_CONFIG: Record<string, { icon: string; color: string; muted: string; label: string }> = {
  paid: {
    icon: '✓', color: 'var(--color-success)', muted: 'var(--color-success-muted)',
    label: 'Paid in Full',
  },
  partially_paid: {
    icon: '◑', color: 'var(--color-warning)', muted: 'var(--color-warning-muted)',
    label: 'Partially Paid',
  },
  unpaid: {
    icon: '✗', color: 'var(--color-danger)', muted: 'var(--color-danger-muted)',
    label: 'Unpaid',
  },
};

export default function FeeStatus() {
  const { userId } = useAuth();
  const { data: fee, isLoading } = useFeeStatus(userId ?? '');

  if (isLoading) return <LoadingSpinner message="Loading fee status…" />;

  const status = fee?.fee_status ?? 'unpaid';
  const cfg    = STATUS_CONFIG[status] ?? STATUS_CONFIG.unpaid;
  const pct    = fee?.total_fee
    ? Math.min(100, Math.round(((fee.paid_amount ?? 0) / fee.total_fee) * 100))
    : 0;

  return (
    <div className="space-y-5 max-w-lg">
      <PageHeader title="Fee Status" subtitle="Your current semester fee payment status" />

      {/* Main status card */}
      <div className="card overflow-hidden">
        {/* Coloured top stripe */}
        <div className="h-1.5 w-full" style={{ backgroundColor: cfg.color }} />

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: cfg.color }}>
              {cfg.icon}
            </div>
            <div>
              <p className="text-2xs uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
                Payment Status
              </p>
              <p className="text-xl font-bold mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
            </div>
          </div>

          {fee ? (
            <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}>
              {[
                { label: 'Total Fee',   value: `₹${Number(fee.total_fee ?? 0).toLocaleString()}` },
                { label: 'Amount Paid', value: `₹${Number(fee.paid_amount ?? 0).toLocaleString()}` },
                { label: 'Balance Due', value: `₹${Number(fee.balance ?? 0).toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center py-4 px-2"
                  style={{ backgroundColor: 'var(--color-surface)' }}>
                  <p className="text-2xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-faint)' }}>
                    {label}
                  </p>
                  <p className="text-base font-bold" style={{ color: 'var(--color-text-base)' }}>{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No fee record found. Please contact the admin.
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {fee && fee.total_fee > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
              Payment Progress
            </p>
            <span className="text-sm font-bold" style={{ color: cfg.color }}>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: cfg.color }}
            />
          </div>
          {fee.last_payment_date && (
            <p className="text-2xs mt-2" style={{ color: 'var(--color-text-faint)' }}>
              Last payment: {new Date(fee.last_payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Hall ticket eligibility */}
      <div className="card p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: status === 'paid' ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
          }}>
          <span>{status === 'paid' ? '🎫' : '🚫'}</span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{
            color: status === 'paid' ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {status === 'paid' ? 'Hall Ticket Eligible (Fee)' : 'Hall Ticket Blocked — Fee Unpaid'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {status === 'paid'
              ? 'Your fee status satisfies the hall ticket requirement.'
              : 'Clear your outstanding dues to unlock hall ticket generation.'}
          </p>
        </div>
      </div>

      {/* Help note */}
      <div className="card-elevated rounded-xl p-4 flex items-start gap-3">
        <span className="text-base flex-shrink-0">💡</span>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>
            Having issues with your fee record?
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Contact the accounts department or raise a query with your college admin.
            Bring your payment receipts for verification.
          </p>
        </div>
      </div>
    </div>
  );
}
