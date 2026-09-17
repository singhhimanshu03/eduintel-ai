import { useState } from 'react';
import { usePlacementReadiness, useSkillGap } from '../../hooks/useAI';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function PlacementProfile() {
  const { isDark } = useTheme();
  const [studentId, setStudentId] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [requiredInput, setRequiredInput] = useState('');
  const [cgpa, setCgpa] = useState('7.5');
  const [backlogs, setBacklogs] = useState('0');
  const [skillCount, setSkillCount] = useState('5');

  const { data: readiness, isLoading: readLoading } = usePlacementReadiness(submitted);
  const skillGap = useSkillGap();

  const handleReadiness = () => setSubmitted(studentId);

  const handleSkillGap = () => {
    skillGap.mutate({
      student_id: studentId,
      student_skills: skillInput.split(',').map(s => s.trim()),
      required_skills: requiredInput.split(',').map(s => s.trim()),
    });
  };

  const score = readiness?.readiness_score ?? 0;
  const gaugeColor = score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
  const gaugeData = [{ name: 'Readiness', value: score, fill: gaugeColor }];

  return (
    <div className="space-y-6">
      <PageHeader title="AI Placement Profile" subtitle="Readiness scoring and skill gap analysis" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Score */}
        <div className="card p-5 space-y-4 animate-fade-in-up">
          <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Placement Readiness Score
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Student ID', studentId, setStudentId],
              ['CGPA', cgpa, setCgpa],
              ['Backlogs', backlogs, setBacklogs],
              ['Skills Count', skillCount, setSkillCount],
            ].map(([label, val, set]) => (
              <div key={label as string}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>{label as string}</label>
                <input className="input-base" value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} />
              </div>
            ))}
          </div>
          <button onClick={handleReadiness} disabled={!studentId} className="btn-primary w-full">Calculate Score</button>

          {readLoading && <LoadingSpinner message="Calculating…" />}
          {readiness && (
            <div className="text-center animate-scale-in">
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={50} outerRadius={80} data={gaugeData} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" maxBarSize={16} />
                  <Tooltip contentStyle={{
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                    borderRadius: 12, fontSize: 12,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-3xl font-heading font-bold" style={{ color: 'var(--color-text-base)' }}>{score}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: gaugeColor }}>{readiness.level}</p>
            </div>
          )}
        </div>

        {/* Skill Gap */}
        <div className="card p-5 space-y-4 animate-fade-in-up stagger-2">
          <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25" />
            </svg>
            Skill Gap Analysis
          </h3>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Student Skills (comma-separated)</label>
            <textarea className="input-base resize-none h-20" value={skillInput}
              onChange={e => setSkillInput(e.target.value)} placeholder="Python, SQL, React, …" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Required Skills (comma-separated)</label>
            <textarea className="input-base resize-none h-20" value={requiredInput}
              onChange={e => setRequiredInput(e.target.value)} placeholder="Python, SQL, Java, Kubernetes, …" />
          </div>
          <button onClick={handleSkillGap} disabled={skillGap.isPending} className="btn-success w-full">
            {skillGap.isPending ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg> Analysing…</>
            ) : '🎯 Analyse Skill Gap'}
          </button>
          {skillGap.data && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="flex-1 progress-bar">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${skillGap.data.skill_coverage_pct}%`, background: 'var(--gradient-success)' }} />
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--color-success)' }}>{skillGap.data.skill_coverage_pct}%</span>
              </div>
              {skillGap.data.missing_skills?.length > 0 && (
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5 mb-2" style={{ color: 'var(--color-danger)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: 'var(--color-danger)' }} />
                    Missing Skills (Priority)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillGap.data.priority_missing.map((s: string) => (
                      <span key={s} className="badge badge-danger">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
