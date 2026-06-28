import { useState } from 'react';
import { usePlacementReadiness, useSkillGap } from '../../hooks/useAI';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

export default function PlacementProfile() {
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
  const gaugeData = [{ name: 'Readiness', value: score, fill: score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444' }];

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400';

  return (
    <div className="space-y-6">
      <PageHeader title="AI Placement Profile" subtitle="Readiness scoring and skill gap analysis" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Readiness Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">📊 Placement Readiness Score</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Student ID</label>
              <input className={inputCls} value={studentId} onChange={e => setStudentId(e.target.value)} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">CGPA</label>
              <input className={inputCls} value={cgpa} onChange={e => setCgpa(e.target.value)} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Backlogs</label>
              <input className={inputCls} value={backlogs} onChange={e => setBacklogs(e.target.value)} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Skills Count</label>
              <input className={inputCls} value={skillCount} onChange={e => setSkillCount(e.target.value)} /></div>
          </div>
          <button onClick={handleReadiness} disabled={!studentId}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            Calculate Score
          </button>

          {readLoading && <LoadingSpinner message="Calculating…" />}
          {readiness && (
            <div className="text-center">
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={50} outerRadius={80} data={gaugeData} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" maxBarSize={16} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-3xl font-bold text-gray-800">{score}</p>
              <p className={`text-sm font-semibold mt-1 ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {readiness.level}
              </p>
            </div>
          )}
        </div>

        {/* Skill Gap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">🎯 Skill Gap Analysis</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Student Skills (comma-separated)</label>
            <textarea className={`${inputCls} resize-none h-20`} value={skillInput}
              onChange={e => setSkillInput(e.target.value)} placeholder="Python, SQL, React, …" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Required Skills (comma-separated)</label>
            <textarea className={`${inputCls} resize-none h-20`} value={requiredInput}
              onChange={e => setRequiredInput(e.target.value)} placeholder="Python, SQL, Java, Kubernetes, …" />
          </div>
          <button onClick={handleSkillGap} disabled={skillGap.isPending}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {skillGap.isPending ? 'Analysing…' : 'Analyse Skill Gap'}
          </button>
          {skillGap.data && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${skillGap.data.skill_coverage_pct}%` }} />
                </div>
                <span className="text-sm font-bold text-green-700">{skillGap.data.skill_coverage_pct}%</span>
              </div>
              {skillGap.data.missing_skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-2">Missing Skills (Priority):</p>
                  <div className="flex flex-wrap gap-2">
                    {skillGap.data.priority_missing.map((s: string) => (
                      <span key={s} className="bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-full">{s}</span>
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
