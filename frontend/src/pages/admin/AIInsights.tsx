import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';
import RiskBadge from '../../components/ui/RiskBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface EligibilityResult {
  student_id: string;
  risk_score: 'Low' | 'Medium' | 'High';
  confidence: number;
}

interface DropoutResult {
  student_id: string;
  dropout_probability: number;
  risk_score: 'Low' | 'Medium' | 'High';
  risk_factors: string[];
}

interface ForecastWeek {
  week: number;
  predicted_attendance: number;
  lower_bound: number;
  upper_bound: number;
}

/* ── Tab definitions ─────────────────────────────────────────────────────── */
const TABS = [
  { id: 'eligibility', label: 'Eligibility Risk',   icon: '🎯' },
  { id: 'dropout',     label: 'Dropout Risk',        icon: '⚠️' },
  { id: 'forecast',    label: 'Attendance Forecast', icon: '📈' },
  { id: 'performance', label: 'Performance',         icon: '📊' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<TabId>('eligibility');

  /* ── Eligibility batch ─────────────────────────────────────────────────── */
  const [eligForm, setEligForm] = useState({
    attendance: '70', feeStatus: 'paid', marks: '60', gpa: '7',
    studentId: 'STU001',
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

  /* ── Dropout ───────────────────────────────────────────────────────────── */
  const [dropForm, setDropForm] = useState({
    studentId: 'STU001', att: '65,70,60', perf: '6,5.5,5',
    feeRatio: '0.7', gpa: '5.5',
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

  /* ── Forecast ──────────────────────────────────────────────────────────── */
  const [forecastForm, setForecastForm] = useState({
    weeklyAtt: '78,72,75,80,65,70,68,73',
    deptId: 'CS', subjectId: 'CS301',
  });
  const forecastMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/attendance-forecast', {
        department_id: forecastForm.deptId,
        subject_id: forecastForm.subjectId,
        weekly_attendance: forecastForm.weeklyAtt.split(',').map(Number),
      }).then(r => r.data),
  });

  /* ── Performance ───────────────────────────────────────────────────────── */
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

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400';

  /* ── Forecast chart data ─────────────────────────────────────────────────── */
  const forecastData: ForecastWeek[] = forecastMutation.data?.data?.forecast ?? [];
  const historyPoints = forecastForm.weeklyAtt.split(',').map((v, i) => ({
    week: `W${i + 1}`, predicted_attendance: parseFloat(v), lower_bound: null, upper_bound: null,
  }));
  const forecastPoints = forecastData.map(f => ({
    week: `F${f.week}`, predicted_attendance: f.predicted_attendance,
    lower_bound: f.lower_bound, upper_bound: f.upper_bound,
  }));
  const chartData = [...historyPoints, ...forecastPoints];

  /* ── Eligibility distribution (from last run) ─────────────────────────── */
  const eligResult = eligMutation.data as EligibilityResult | undefined;
  const dropResult = dropMutation.data as DropoutResult | undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="AI Insights" subtitle="Machine learning predictions and academic intelligence" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Eligibility Risk Tab ─────────────────────────────────────────── */}
      {activeTab === 'eligibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">Run Eligibility Risk Prediction</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Student ID', 'studentId', 'STU001'],
                ['Attendance %', 'attendance', '70'],
                ['Avg Internal Marks', 'marks', '60'],
                ['Prev Semester GPA', 'gpa', '7'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input className={inputCls} placeholder={placeholder}
                    value={(eligForm as Record<string, string>)[key]}
                    onChange={e => setEligForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fee Status</label>
                <select className={inputCls} value={eligForm.feeStatus}
                  onChange={e => setEligForm(f => ({ ...f, feeStatus: e.target.value }))}>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>
            <button onClick={() => eligMutation.mutate()} disabled={eligMutation.isPending}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {eligMutation.isPending ? '⏳ Predicting…' : '🎯 Run Prediction'}
            </button>

            {eligResult && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Risk Score</span>
                  <RiskBadge risk={eligResult.risk_score} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidence</span>
                  <span className="text-sm font-semibold text-indigo-700">{(eligResult.confidence * 100).toFixed(1)}%</span>
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

      {/* ── Dropout Risk Tab ─────────────────────────────────────────────── */}
      {activeTab === 'dropout' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">Dropout Risk Analysis</h3>
            <p className="text-xs text-gray-500">Enter comma-separated values for the last 3 semesters.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Student ID',      'studentId','STU001'],
                ['Current GPA',     'gpa',      '5.5'],
                ['Fee Paid Ratio',  'feeRatio', '0.7'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input className={inputCls} placeholder={placeholder}
                    value={(dropForm as Record<string, string>)[key]}
                    onChange={e => setDropForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Attendance Trend (3 semesters, comma-sep)</label>
              <input className={inputCls} placeholder="65,70,60" value={dropForm.att}
                onChange={e => setDropForm(f => ({ ...f, att: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">GPA Trend (3 semesters, comma-sep)</label>
              <input className={inputCls} placeholder="6,5.5,5" value={dropForm.perf}
                onChange={e => setDropForm(f => ({ ...f, perf: e.target.value }))} />
            </div>
            <button onClick={() => dropMutation.mutate()} disabled={dropMutation.isPending}
              className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {dropMutation.isPending ? '⏳ Analysing…' : '⚠️ Analyse Dropout Risk'}
            </button>

            {dropResult && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Dropout Probability</span>
                  <span className="text-lg font-bold text-red-600">{(dropResult.dropout_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <RiskBadge risk={dropResult.risk_score} />
                </div>
                {dropResult.risk_factors?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Risk Factors:</p>
                    <ul className="space-y-1">
                      {dropResult.risk_factors.map((f, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-2">
                          <span className="text-red-400">•</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Probability gauge */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center justify-center">
            {dropResult ? (
              <>
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke={dropResult.dropout_probability >= 0.65 ? '#EF4444' : dropResult.dropout_probability >= 0.35 ? '#F59E0B' : '#10B981'}
                      strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${dropResult.dropout_probability * 314} 314`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                    <span className="text-2xl font-bold text-gray-800">
                      {(dropResult.dropout_probability * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-gray-500">dropout risk</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Student <strong>{dropForm.studentId}</strong> has a
                  <span className={`font-bold mx-1 ${
                    dropResult.risk_score === 'High' ? 'text-red-600' :
                    dropResult.risk_score === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>{dropResult.risk_score.toLowerCase()} risk</span>
                  of dropping out.
                </p>
              </>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-4xl mb-3">🔮</p>
                <p className="text-sm">Run the dropout analysis to see the probability gauge.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Attendance Forecast Tab ───────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">Attendance Forecast</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Department ID</label>
                <input className={inputCls} value={forecastForm.deptId}
                  onChange={e => setForecastForm(f => ({ ...f, deptId: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subject ID</label>
                <input className={inputCls} value={forecastForm.subjectId}
                  onChange={e => setForecastForm(f => ({ ...f, subjectId: e.target.value }))} />
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button onClick={() => forecastMutation.mutate()} disabled={forecastMutation.isPending}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {forecastMutation.isPending ? '⏳ Forecasting…' : '📈 Forecast'}
                </button>
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs text-gray-500 mb-1 block">Weekly Attendance History (comma-separated, last 8 weeks)</label>
                <input className={inputCls} value={forecastForm.weeklyAtt}
                  onChange={e => setForecastForm(f => ({ ...f, weeklyAtt: e.target.value }))}
                  placeholder="78,72,75,80,65,70,68,73" />
              </div>
            </div>
          </div>

          {forecastMutation.data && (
            <>
              {forecastMutation.data.data?.below_threshold_alert && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-sm text-red-700 font-medium">
                    Alert: Attendance is predicted to fall below the 75% threshold in the next 2 weeks. Immediate intervention recommended.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Attendance Trend + 4-Week Forecast</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v?.toFixed(1)}%`, '']} />
                    <Legend />
                    <ReferenceLine y={75} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '75% threshold', fill: '#EF4444', fontSize: 10 }} />
                    <Line type="monotone" dataKey="predicted_attendance" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} name="Attendance %" />
                    <Line type="monotone" dataKey="upper_bound" stroke="#A5B4FC" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Upper bound" />
                    <Line type="monotone" dataKey="lower_bound" stroke="#FCA5A5" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Lower bound" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {forecastData.map((f: ForecastWeek) => (
                  <div key={f.week} className={`rounded-xl border p-4 text-center ${
                    f.predicted_attendance < 75 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <p className="text-xs text-gray-500 font-medium">Week {f.week}</p>
                    <p className={`text-2xl font-bold mt-1 ${f.predicted_attendance < 75 ? 'text-red-700' : 'text-green-700'}`}>
                      {f.predicted_attendance}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{f.lower_bound}% – {f.upper_bound}%</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Performance Prediction Tab ──────────────────────────────────── */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">Performance Prediction</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Student ID',    'studentId',  'STU001'],
                ['Attendance %',  'attendance', '72'],
                ['Prev GPA',      'gpa',        '7'],
                ['Backlog Count', 'backlogs',   '0'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input className={inputCls} placeholder={placeholder}
                    value={(perfForm as Record<string, string>)[key]}
                    onChange={e => setPerfForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Internal Marks per Subject (comma-sep)</label>
              <input className={inputCls} placeholder="65,70,55" value={perfForm.marks}
                onChange={e => setPerfForm(f => ({ ...f, marks: e.target.value }))} />
            </div>
            <button onClick={() => perfMutation.mutate()} disabled={perfMutation.isPending}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {perfMutation.isPending ? '⏳ Predicting…' : '📊 Predict Performance'}
            </button>
          </div>

          {perfMutation.data && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-700">Prediction Results</h3>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-xs text-indigo-600 font-medium">Predicted GPA Range</p>
                <p className="text-3xl font-bold text-indigo-800 mt-1">
                  {perfMutation.data.predicted_gpa_lower} – {perfMutation.data.predicted_gpa_upper}
                </p>
                <p className="text-xs text-indigo-500 mt-1">out of 10.0</p>
              </div>

              {perfMutation.data.flagged_subjects?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2">⚠️ High Backlog Risk Subjects:</p>
                  <div className="space-y-2">
                    {Object.entries(perfMutation.data.backlog_probability as Record<string, number>).map(([subj, prob]) => (
                      <div key={subj} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{subj}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${prob > 0.7 ? 'bg-red-500' : prob > 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${prob * 100}%` }} />
                          </div>
                          <span className="text-xs font-semibold w-10 text-right">{(prob * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
