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

      <div className="card p-6 space-y-5 transition-colors duration-200">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Compose Notification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recipient User ID</label>
            <input className="input-base" placeholder="Leave blank to broadcast"
              value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Channel</label>
            <select className="input-base" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Event Type</label>
            <select className="input-base" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}>
              {EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.icon} {et.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject</label>
            <input className="input-base" placeholder="Notification subject"
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message *</label>
          <textarea className="input-base resize-none h-24" placeholder="Type your message here…"
            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
        </div>
        {sent && (
          <div className="rounded-lg px-3 py-2 text-sm
            bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40
            text-green-700 dark:text-green-300">
            ✓ Notification sent successfully!
          </div>
        )}
        <button onClick={() => sendNotification.mutate()} disabled={sendNotification.isPending || !form.message}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
          {sendNotification.isPending ? '⏳ Sending…' : '📤 Send Notification'}
        </button>
      </div>

      <div className="card p-5 transition-colors duration-200">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-4">Quick Send Presets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESETS.map(preset => (
            <button key={preset.label}
              onClick={() => setForm(f => ({ ...f, eventType: preset.eventType, subject: preset.subject, message: preset.message }))}
              className="flex items-start gap-3 p-3 rounded-lg text-left transition
                border border-gray-200 dark:border-white/10
                hover:border-indigo-300 dark:hover:border-indigo-700
                hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
              <span className="text-2xl">{preset.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{preset.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{preset.message}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
