import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../app/api';
import PageHeader from '../../components/ui/PageHeader';

const EVENT_TYPES = [
  { value: 'fee_reminder',       label: 'Fee Reminder',       icon: '💰' },
  { value: 'attendance_warning', label: 'Attendance Warning', icon: '📋' },
  { value: 'result_published',   label: 'Result Published',   icon: '📚' },
  { value: 'placement_update',   label: 'Placement Update',   icon: '🎓' },
  { value: 'dropout_risk_alert', label: 'Dropout Risk Alert', icon: '⚠️' },
  { value: 'custom',             label: 'Custom Message',     icon: '✉️' },
];

const PRESETS = [
  { label: 'Fee Due Reminder',  icon: '💰', eventType: 'fee_reminder',       subject: 'Fee Due Reminder',      message: 'Your fee payment is pending. Please clear dues immediately to avoid hall ticket blocking.' },
  { label: 'Attendance Warning',icon: '📋', eventType: 'attendance_warning', subject: 'Low Attendance Warning', message: 'Your attendance has fallen below the required 75% threshold. Please attend all remaining classes.' },
  { label: 'Exam Schedule',     icon: '📅', eventType: 'custom',             subject: 'Exam Schedule Released', message: 'The examination schedule has been published. Please check the Exam section for your hall ticket.' },
  { label: 'Result Published',  icon: '📚', eventType: 'result_published',   subject: 'Results Published',      message: 'Your semester examination results have been published. Log in to view your performance.' },
];

export default function NotificationCenter() {
  const [form, setForm] = useState({ userId: '', eventType: 'custom', channel: 'in_app', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const sendNotification = useMutation({
    mutationFn: () => api.post('/notifications/send', form).then(r => r.data),
    onSuccess: () => { setSent(true); setTimeout(() => setSent(false), 4000); setForm(f => ({ ...f, message: '', subject: '' })); },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Notification Center" subtitle="Send alerts, reminders, and announcements" />

      <div className="card p-6 space-y-5">
        <h3 className="text-sm font-heading font-bold flex items-center gap-2" style={{ color: 'var(--color-text-base)' }}>
          <svg className="w-4 h-4" fill="none" stroke="var(--color-primary)" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Compose Notification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Recipient User ID</label>
            <input className="input-base" placeholder="Leave blank to broadcast"
              value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Channel</label>
            <select className="input-base select-styled" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Event Type</label>
            <select className="input-base select-styled" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
              {EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.icon} {et.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>Subject</label>
            <input className="input-base" placeholder="Notification subject"
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
            Message <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea className="input-base resize-none h-24" placeholder="Type your message here…"
            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
        </div>
        {sent && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-success-muted)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <svg className="w-4 h-4" fill="none" stroke="var(--color-success)" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>Notification sent successfully!</p>
          </div>
        )}
        <button onClick={() => sendNotification.mutate()} disabled={sendNotification.isPending || !form.message} className="btn-primary">
          {sendNotification.isPending ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Sending…</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg> Send Notification</>
          )}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-heading font-bold mb-4" style={{ color: 'var(--color-text-base)' }}>Quick Send Presets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESETS.map(preset => (
            <button key={preset.label}
              onClick={() => setForm(f => ({ ...f, eventType: preset.eventType, subject: preset.subject, message: preset.message }))}
              className="card card-hover-lift flex items-start gap-3 p-4 text-left group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: 'var(--color-elevated)' }}>
                {preset.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-base)' }}>{preset.label}</p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-faint)' }}>{preset.message}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
