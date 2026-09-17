import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import RiskBadge from '../../components/ui/RiskBadge';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

/* ── Types ───────────────────────────────────────────────────────────── */
interface EligibilityResult { student_id: string; risk_score: 'Low' | 'Medium' | 'High'; confidence: number; }
interface DropoutResult { student_id: string; dropout_probability: number; risk_score: 'Low' | 'Medium' | 'High'; risk_factors: string[]; }
interface ForecastWeek { week: number; predicted_attendance: number; lower_bound: number; upper_bound: number; }

/* ── Tab definitions ─────────────────────────────────────────────────── */
const TABS = [
  { id: 'eligibility', label: 'Eligibility Risk',   icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
  { id: 'dropout',     label: 'Dropout Risk',       icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
  { id: 'forecast',    label: 'Attendance Forecast', icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941' },
  { id: 'performance', label: 'Performance',        icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
] as const;
type TabId = typeof TABS[number]['id'];

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<TabId>('eligibility');
  const { isDark } = useTheme();

  // Shared chart styles
  const grid    = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const tickClr = isDark ? '#64748B' : '#94A3B8';
  const ttStyle = {
    background: isDark ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: 8, color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  /* ── Eligibility ─────────────────────────────────────────────── */
  const [eligForm, setEligForm] = useState({
    attendance: '70', feeStatus: 'paid', marks: '60', gpa: '7', studentId: 'STU001',
  });
  const eligMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/eligibility-risk', {
        student_id: eligForm.studentId,
        attendance_percentage: parseFloat(eligForm.attendance),
        fee_status: eligForm.feeStatus,
        avg_internal_marks: parseFloat(eligForm.marks),
        prev_semester_gpa: parseFloat(eligForm.gpa),
      }).then(r => r.data.data ?? r.data),
  });

  /* ── Dropout ─────────────────────────────────────────────────── */
  const [dropForm, setDropForm] = useState({
    studentId: 'STU001', att: '65,70,60', perf: '6,5.5,5', feeRatio: '0.7', gpa: '5.5',
  });
  const dropMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/dropout-risk', {
        student_id: dropForm.studentId,
        attendance_trend: dropForm.att.split(',').map(Number),
        performance_trend: dropForm.perf.split(',').map(Number),
        fee_paid_ratio: parseFloat(dropForm.feeRatio),
        current_gpa: parseFloat(dropForm.gpa),
      }).then(r => r.data.data ?? r.data),
  });

  /* ── Forecast ────────────────────────────────────────────────── */
  const [forecastForm, setForecastForm] = useState({
    weeklyAtt: '78,72,75,80,65,70,68,73', deptId: 'CS', subjectId: 'CS301',
  });
  const forecastMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/attendance-forecast', {
        department_id: forecastForm.deptId,
        subject_id: forecastForm.subjectId,
        weekly_attendance: forecastForm.weeklyAtt.split(',').map(Number),
      }).then(r => r.data),
  });

  /* ── Performance ─────────────────────────────────────────────── */
  const [perfForm, setPerfForm] = useState({
    studentId: 'STU001', marks: '65,70,55', attendance: '72', gpa: '7', backlogs: '0',
  });
  const perfMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/performance-predict', {
        student_id: perfForm.studentId,
        internal_marks: perfForm.marks.split(',').map(Number),
        attendance_percentage: parseFloat(perfForm.attendance),
        prev_semester_gpa: parseFloat(perfForm.gpa),
        backlog_count: parseInt(perfForm.backlogs),
      }).then(r => r.data.data ?? r.data),
  });

  const eligResult = eligMutation.data as EligibilityResult | undefined;
  const dropResult = dropMutation.data as DropoutResult | undefined;

  const forecastData: ForecastWeek[] = forecastMutation.data?.data?.forecast ?? [];
  const historyPoints = forecastForm.weeklyAtt.split(',').map((v, i) => ({
    week: `W${i + 1}`, predicted_attendance: parseFloat(v), lower_bound: null, upper_bound: null,
  }));
  const forecastPoints = forecastData.map(f => ({
    week: `F${f.week}`, predicted_attendance: f.predicted_attendance,
    lower_bound: f.lower_bound, upper_bound: f.upper_bound,
  }));
  const chartData = [...historyPoints, ...forecastPoints];

  return (
    <div className="space-y-6">
      {/* ── AI-branded header ─────────────────────────────────────── */}
      <div className="card-glass p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'var(--gradient-primary)', filter: 'blur(50px)' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
              AI Insights
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Machine learning predictions and academic intelligence
            </p>
          </div>
          <span className="badge badge-gradient text-[10px] ml-auto">AI POWERED</span>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ backgroundColor: 'var(--color-elevated)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-faint)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
            }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Eligibility Risk Tab ─────────────────────────────────── */}
      {activeTab === 'eligibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
              Run Eligibility Risk Prediction
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Student ID', 'studentId', 'STU001'],
                ['Attendance %', 'attendance', '70'],
                ['Avg Internal Marks', 'marks', '60'],
                ['Prev Semester GPA', 'gpa', '7'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>{label}</label>
                  <input className="input-base" placeholder={placeholder}
                    value={(eligForm as Record<string, string>)[key]}
                    onChange={e => setEligForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>Fee Status</label>
                <select className="input-base select-styled" value={eligForm.feeStatus}
                  onChange={e => setEligForm(f => ({ ...f, feeStatus: e.target.value }))}>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>
            <button onClick={() => eligMutation.mutate()} disabled={eligMutation.isPending}
              className="btn-primary w-full">
              {eligMutation.isPending ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg> Predicting…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25" />
                </svg> Run Prediction</>
              )}
            </button>

            {/* Result card */}
            {eligResult && (
              <div className="card-glass rounded-xl p-4 space-y-3 animate-scale-in"
                style={{
                  boxShadow: eligResult.risk_score === 'High' ? '0 0 20px rgba(239,68,68,0.15)' : 'var(--shadow-md)',
                  border: eligResult.risk_score === 'High' ? '1px solid rgba(239,68,68,0.3)' : undefined,
                }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>Risk Score</span>
                  <RiskBadge risk={eligResult.risk_score} size="md" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                      {(eligResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${eligResult.confidence * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <RiskDistributionChart
            low={eligResult?.risk_score === 'Low' ? 1 : 0}
            medium={eligResult?.risk_score === 'Medium' ? 1 : 0}
            high={eligResult?.risk_score === 'High' ? 1 : 0}
          />
        </div>
      )}

      {/* ── Dropout Risk Tab ─────────────────────────────────────── */}
      {activeTab === 'dropout' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
              Dropout Risk Analysis
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Enter comma-separated values for the last 3 semesters.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Student ID',      'studentId','STU001'],
                ['Current GPA',     'gpa',      '5.5'],
                ['Fee Paid Ratio',  'feeRatio', '0.7'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>{label}</label>
                  <input className="input-base" placeholder={placeholder}
                    value={(dropForm as Record<string, string>)[key]}
                    onChange={e => setDropForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>Attendance Trend (3 semesters, comma-sep)</label>
              <input className="input-base" placeholder="65,70,60" value={dropForm.att}
                onChange={e => setDropForm(f => ({ ...f, att: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>GPA Trend (3 semesters, comma-sep)</label>
              <input className="input-base" placeholder="6,5.5,5" value={dropForm.perf}
                onChange={e => setDropForm(f => ({ ...f, perf: e.target.value }))} />
            </div>
            <button onClick={() => dropMutation.mutate()} disabled={dropMutation.isPending}
              className="btn-danger w-full">
              {dropMutation.isPending ? '⏳ Analysing…' : '⚠️ Analyse Dropout Risk'}
            </button>

            {dropResult && (
              <div className="card-glass rounded-xl p-4 space-y-3 animate-scale-in"
                style={{ boxShadow: dropResult.risk_score === 'High' ? '0 0 20px rgba(239,68,68,0.15)' : 'var(--shadow-md)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>Dropout Probability</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--color-danger)' }}>{(dropResult.dropout_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="progress-bar" style={{ height: '0.375rem' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${dropResult.dropout_probability * 100}%`,
                    background: dropResult.dropout_probability >= 0.65 ? 'var(--gradient-danger)' :
                               dropResult.dropout_probability >= 0.35 ? 'var(--gradient-warning)' : 'var(--gradient-success)',
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Risk Level</span>
                  <RiskBadge risk={dropResult.risk_score} size="md" />
                </div>
                {dropResult.risk_factors?.length > 0 && (
                  <div className="pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-faint)' }}>Risk Factors</p>
                    <div className="space-y-1.5">
                      {dropResult.risk_factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-danger)' }} />
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dropout gauge */}
          <div className="card p-5 flex flex-col items-center justify-center">
            {dropResult ? (
              <>
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12"
                      stroke={isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB'} />
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke={dropResult.dropout_probability >= 0.65 ? '#EF4444' : dropResult.dropout_probability >= 0.35 ? '#F59E0B' : '#10B981'}
                      strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${dropResult.dropout_probability * 314} 314`}
                      style={{ transition: 'stroke-dasharray 800ms ease-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
                      {(dropResult.dropout_probability * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-faint)' }}>dropout risk</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                  Student <strong style={{ color: 'var(--color-text-base)' }}>{dropForm.studentId}</strong> has a
                  <span className="font-bold mx-1" style={{
                    color: dropResult.risk_score === 'High' ? 'var(--color-danger)' :
                           dropResult.risk_score === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)',
                  }}>{dropResult.risk_score.toLowerCase()} risk</span>
                  of dropping out.
                </p>
              </>
            ) : (
              <div className="text-center animate-fade-in">
                <div className="text-5xl mb-4">🔮</div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Run the dropout analysis</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>to see the probability gauge</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Attendance Forecast Tab ───────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>Attendance Forecast</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>Department ID</label>
                <input className="input-base" value={forecastForm.deptId}
                  onChange={e => setForecastForm(f => ({ ...f, deptId: e.target.value }))} />
              </div>
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>Subject ID</label>
                <input className="input-base" value={forecastForm.subjectId}
                  onChange={e => setForecastForm(f => ({ ...f, subjectId: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <button onClick={() => forecastMutation.mutate()} disabled={forecastMutation.isPending}
                  className="btn-primary w-full">
                  {forecastMutation.isPending ? '⏳ Forecasting…' : '📈 Forecast'}
                </button>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>Weekly Attendance History (comma-separated, last 8 weeks)</label>
                <input className="input-base" value={forecastForm.weeklyAtt}
                  onChange={e => setForecastForm(f => ({ ...f, weeklyAtt: e.target.value }))} placeholder="78,72,75,80,65,70,68,73" />
              </div>
            </div>
          </div>

          {forecastMutation.data && (
            <>
              {forecastMutation.data.data?.below_threshold_alert && (
                <div className="flex items-center gap-3 p-4 rounded-xl animate-fade-in"
                  style={{ backgroundColor: 'var(--color-danger-muted)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-2xl">⚠️</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                    Alert: Attendance is predicted to fall below the 75% threshold. Immediate intervention recommended.
                  </p>
                </div>
              )}

              <div className="card p-5">
                <h3 className="text-sm font-heading font-bold mb-4" style={{ color: 'var(--color-text-base)' }}>Attendance Trend + 4-Week Forecast</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: tickClr }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tickClr }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={ttStyle} formatter={(v: number) => [`${v?.toFixed(1)}%`, '']} />
                    <Legend />
                    <ReferenceLine y={75} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '75% threshold', fill: '#EF4444', fontSize: 10 }} />
                    <Line type="monotone" dataKey="predicted_attendance" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366F1', stroke: 'var(--color-surface)', strokeWidth: 2 }} name="Attendance %" />
                    <Line type="monotone" dataKey="upper_bound" stroke="#A5B4FC" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Upper bound" />
                    <Line type="monotone" dataKey="lower_bound" stroke="#FCA5A5" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Lower bound" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {forecastData.map((f: ForecastWeek) => (
                  <div key={f.week} className={`card card-hover-lift p-4 text-center ${
                    f.predicted_attendance < 75 ? '' : ''
                  }`} style={{
                    borderColor: f.predicted_attendance < 75 ? 'rgba(239,68,68,0.3)' : undefined,
                  }}>
                    <p className="text-[11px] font-semibold uppercase" style={{ color: 'var(--color-text-faint)' }}>Week {f.week}</p>
                    <p className="text-2xl font-heading font-bold mt-1" style={{
                      color: f.predicted_attendance < 75 ? 'var(--color-danger)' : 'var(--color-success)',
                    }}>
                      {f.predicted_attendance}%
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-faint)' }}>
                      {f.lower_bound}% – {f.upper_bound}%
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Performance Prediction Tab ────────────────────────────── */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>
              Performance Prediction
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Student ID',    'studentId',  'STU001'],
                ['Attendance %',  'attendance', '72'],
                ['Prev GPA',      'gpa',        '7'],
                ['Backlog Count', 'backlogs',   '0'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>{label}</label>
                  <input className="input-base" placeholder={placeholder}
                    value={(perfForm as Record<string, string>)[key]}
                    onChange={e => setPerfForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--color-text-faint)' }}>Internal Marks per Subject (comma-sep)</label>
              <input className="input-base" placeholder="65,70,55" value={perfForm.marks}
                onChange={e => setPerfForm(f => ({ ...f, marks: e.target.value }))} />
            </div>
            <button onClick={() => perfMutation.mutate()} disabled={perfMutation.isPending}
              className="btn-primary w-full">
              {perfMutation.isPending ? '⏳ Predicting…' : '📊 Predict Performance'}
            </button>
          </div>

          {perfMutation.data ? (
            <div className="card p-5 space-y-4 animate-scale-in">
              <h3 className="text-sm font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>Prediction Results</h3>
              <div className="card-glass rounded-xl p-5"
                style={{ background: 'var(--color-primary-muted)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--color-primary)' }}>Predicted GPA Range</p>
                <p className="text-3xl font-heading font-bold mt-1" style={{ color: 'var(--color-primary)' }}>
                  {perfMutation.data.predicted_gpa_lower} – {perfMutation.data.predicted_gpa_upper}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>out of 10.0</p>
              </div>

              {perfMutation.data.flagged_subjects?.length > 0 && (
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5 mb-3" style={{ color: 'var(--color-danger)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                    High Backlog Risk Subjects
                  </p>
                  <div className="space-y-2.5">
                    {Object.entries(perfMutation.data.backlog_probability as Record<string, number>).map(([subj, prob]) => (
                      <div key={subj} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-base)' }}>{subj}</span>
                        <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                          <div className="progress-bar flex-1">
                            <div className="h-full rounded-full" style={{
                              width: `${prob * 100}%`,
                              background: prob > 0.7 ? 'var(--gradient-danger)' : prob > 0.4 ? 'var(--gradient-warning)' : 'var(--gradient-success)',
                            }} />
                          </div>
                          <span className="text-xs font-bold w-10 text-right" style={{
                            color: prob > 0.7 ? 'var(--color-danger)' : prob > 0.4 ? 'var(--color-warning)' : 'var(--color-success)',
                          }}>{(prob * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5 flex items-center justify-center">
              <div className="text-center animate-fade-in">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Run the prediction</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>to see performance results</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
