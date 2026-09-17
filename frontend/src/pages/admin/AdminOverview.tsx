import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useAdminDashboard } from '../../hooks/useDashboard';
import StatCard from '../../components/ui/StatCard';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import FeeCollectionChart from '../../components/charts/FeeCollectionChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskBadge from '../../components/ui/RiskBadge';

/* ── Animated counter hook ───────────────────────────────────────────── */
function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    if (!target || isNaN(target)) return;
    const start = ref.current;
    const range = target - start;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + range * eased);
      setValue(current);
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ── Quick Action Card ───────────────────────────────────────────────── */
function QuickAction({ icon, label, onClick, color = 'primary' }: {
  icon: string; label: string; onClick: () => void; color?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'var(--color-primary-muted)',
    success: 'var(--color-success-muted)',
    warning: 'var(--color-warning-muted)',
    danger:  'var(--color-danger-muted)',
    info:    'var(--color-info-muted)',
  };
  return (
    <button onClick={onClick}
      className="card card-hover-lift p-4 flex flex-col items-center gap-2.5 text-center group cursor-pointer"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-transform duration-200
        group-hover:scale-110" style={{ backgroundColor: colorMap[color] }}>
        {icon}
      </div>
      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-base)' }}>{label}</span>
    </button>
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const { role } = useSelector((s: RootState) => s.auth);
  const { data, isLoading } = useAdminDashboard();

  // Loading state with skeleton
  if (isLoading) return <LoadingSpinner message="Loading dashboard…" />;

  const att    = data?.attendance?.data;
  const fees   = data?.fees?.data;
  const ai     = data?.aiInsights?.data;
  const feeSum = fees?.summary ?? [];
  const paid   = feeSum.find((s: { fee_status: string }) => s.fee_status === 'paid');
  const totalCollected = paid?.total_collected ?? 0;

  const totalStudents   = data?.totalStudents ?? data?.students?.total ?? 0;
  const avgAttendance   = att ? parseFloat(att.averageAttendance ?? 0) : (data?.avgAttendance ? Number(data.avgAttendance) : 0);
  const highRisk        = ai?.high ?? data?.atRiskStudents?.high ?? 0;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const roleLabel = role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Admin';

  return (
    <div className="space-y-6">

      {/* ── Welcome Section ──────────────────────────────────────────── */}
      <div className="animate-fade-in-up">
        <div className="card-glass p-6 relative overflow-hidden">
          {/* Background gradient accent */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'var(--gradient-primary)', filter: 'blur(60px)' }} />
          <div className="relative">
            <h1 className="text-2xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
              {greeting}, {roleLabel} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Here's your academic intelligence snapshot for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>

      {/* ── Animated KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in-up stagger-1">
          <StatCard title="Total Students" value={totalStudents} icon="👥" color="indigo"
            trend={{ value: '+12%', up: true }} subtitle="Enrolled students" />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatCard title="Avg Attendance" value={avgAttendance ? `${avgAttendance.toFixed(1)}%` : '—'} icon="📋" color="green"
            trend={avgAttendance >= 75 ? { value: 'Above threshold', up: true } : { value: 'Below threshold', up: false }} />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatCard title="Fee Collected" value={totalCollected ? `₹${Number(totalCollected).toLocaleString()}` : '—'} icon="💰" color="green"
            subtitle="This semester" />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <StatCard title="High-Risk Students" value={highRisk} icon="⚠️" color="red"
            subtitle="Eligibility risk" trend={Number(highRisk) > 0 ? { value: `${highRisk} flagged`, up: false } : undefined} />
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fade-in-up stagger-3">
          <RiskDistributionChart low={ai?.low ?? 0} medium={ai?.medium ?? 0} high={ai?.high ?? 0} />
        </div>
        <div className="animate-fade-in-up stagger-4">
          {fees?.dailyCollection?.length > 0
            ? <FeeCollectionChart data={fees.dailyCollection} />
            : (
              <div className="card p-5 flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
                <span className="text-3xl">📊</span>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Fee Collection Trend
                </p>
                <p className="text-xs text-center" style={{ color: 'var(--color-text-faint)' }}>
                  No transactions recorded in the last 30 days.
                </p>
                {feeSum.length > 0 && (
                  <div className="w-full mt-2 space-y-2">
                    {feeSum.map((s: { fee_status: string; count: string; total_collected: string }) => (
                      <div key={s.fee_status} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ backgroundColor: 'var(--color-elevated)' }}>
                        <span className="text-xs capitalize font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          {s.fee_status.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-base)' }}>
                          ₹{Number(s.total_collected ?? 0).toLocaleString()} ({s.count})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }
        </div>
      </div>

      {/* ── AI Insights Widget + Below-Threshold Students ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Quick Insights */}
        <div className="animate-fade-in-up stagger-5 card-glass p-5 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-15 pointer-events-none"
            style={{ background: 'var(--gradient-primary)', filter: 'blur(40px)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                style={{ background: 'var(--gradient-primary)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
                AI Insights
              </h3>
              <span className="badge badge-gradient text-[10px] ml-auto">LIVE</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Low Risk</span>
                <RiskBadge risk="Low" />
                <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>{ai?.low ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Medium Risk</span>
                <RiskBadge risk="Medium" />
                <span className="text-sm font-bold" style={{ color: 'var(--color-warning)' }}>{ai?.medium ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>High Risk</span>
                <RiskBadge risk="High" />
                <span className="text-sm font-bold" style={{ color: 'var(--color-danger)' }}>{ai?.high ?? 0}</span>
              </div>
            </div>
            <button onClick={() => navigate('/admin/ai-insights')}
              className="btn-primary w-full mt-4 text-xs py-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25" />
              </svg>
              View AI Insights
            </button>
          </div>
        </div>

        {/* Below Threshold Students */}
        <div className="animate-fade-in-up stagger-5 card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--color-danger)' }} />
              Students Below Attendance Threshold
            </p>
            <span className="badge badge-danger text-[10px]">
              {att?.studentsBelowThreshold?.length ?? 0} flagged
            </span>
          </div>
          {att?.studentsBelowThreshold?.length ? (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {att.studentsBelowThreshold.slice(0, 8).map((s: { student_id: string; subject_code: string; attendance_percentage: number }, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-danger-muted)', color: 'var(--color-danger)' }}>
                      {s.student_id.slice(-2)}
                    </div>
                    <div>
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text-base)' }}>
                        {s.student_id}
                      </span>
                      <span className="ml-2 badge badge-neutral text-[10px]">{s.subject_code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-elevated)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${s.attendance_percentage}%`,
                        background: s.attendance_percentage < 50 ? 'var(--gradient-danger)' : 'var(--color-warning)',
                      }} />
                    </div>
                    <span className="text-xs font-bold min-w-[40px] text-right" style={{ color: 'var(--color-danger)' }}>
                      {s.attendance_percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                All students are above the threshold
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
                Great work! No students need immediate attention.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-6">
        <p className="section-title mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickAction icon="➕" label="Add Student"    onClick={() => navigate('/admin/students/new')} color="primary" />
          <QuickAction icon="📊" label="View Reports"  onClick={() => navigate('/admin/reports')} color="info" />
          <QuickAction icon="🎯" label="AI Insights"   onClick={() => navigate('/admin/ai-insights')} color="warning" />
          <QuickAction icon="📋" label="Attendance"     onClick={() => navigate('/admin/attendance')} color="success" />
          <QuickAction icon="💰" label="Fee Defaulters" onClick={() => navigate('/admin/defaulters')} color="danger" />
        </div>
      </div>
    </div>
  );
}
