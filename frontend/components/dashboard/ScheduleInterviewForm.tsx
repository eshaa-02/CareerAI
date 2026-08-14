'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { interviewService, ScheduleInterviewPayload } from '@/services/interviewService';

const INTERVIEW_TYPES = [
  { value: 'online', label: 'Online' },
  { value: 'on-site', label: 'On-site' },
  { value: 'phone-call', label: 'Phone Call' },
  { value: 'technical-assessment', label: 'Technical Assessment' },
  { value: 'hr-interview', label: 'HR Interview' },
  { value: 'final-interview', label: 'Final Interview' },
];

const ROUNDS = [
  { value: 'round-1', label: 'Round 1' },
  { value: 'round-2', label: 'Round 2' },
  { value: 'round-3', label: 'Round 3' },
  { value: 'technical', label: 'Technical' },
  { value: 'hr', label: 'HR' },
  { value: 'final', label: 'Final Round' },
];

const PLATFORMS = [
  { value: 'google-meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'microsoft-teams', label: 'Microsoft Teams' },
  { value: 'phone', label: 'Phone' },
  { value: 'in-person', label: 'In Person' },
  { value: 'other', label: 'Other' },
];

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dubai'];

interface ScheduleInterviewFormProps {
  applicationId: string;
  onScheduled?: () => void;
}

export default function ScheduleInterviewForm({ applicationId, onScheduled }: ScheduleInterviewFormProps) {
  const [form, setForm] = useState<Omit<ScheduleInterviewPayload, 'applicationId'>>({
    interviewRound: 'round-1',
    interviewType: 'online',
    meetingPlatform: 'google-meet',
    meetingLink: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    durationMinutes: 30,
    timezone: 'UTC',
    instructions: '',
    agenda: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const isPhysical = form.interviewType === 'on-site';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await interviewService.schedule({ ...form, applicationId });
      toast.success('Interview scheduled and invitation sent');
      onScheduled?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Interview Round</label>
          <select value={form.interviewRound} onChange={(e) => setForm({ ...form, interviewRound: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm">
            {ROUNDS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Interview Type</label>
          <select value={form.interviewType} onChange={(e) => setForm({ ...form, interviewType: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm">
            {INTERVIEW_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Date</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Start Time</label>
          <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">End Time</label>
          <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Timezone</label>
          <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm">
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Duration (minutes)</label>
          <input
            type="number"
            min={15}
            step={15}
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {isPhysical ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Office address"
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Meeting Platform</label>
            <select value={form.meetingPlatform} onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm">
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Meeting Link</label>
            <input
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              placeholder="https://meet.google.com/..."
              className="w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Instructions for candidate</label>
        <textarea
          rows={3}
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="What should the candidate prepare or bring?"
          className="w-full rounded-xl px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Interview Agenda</label>
        <textarea
          rows={3}
          value={form.agenda}
          onChange={(e) => setForm({ ...form, agenda: e.target.value })}
          placeholder="Topics to be covered, format, panel structure..."
          className="w-full rounded-xl px-4 py-2.5 text-sm"
        />
      </div>

      <Button type="submit" fullWidth size="lg" loading={submitting}>
        Schedule Interview &amp; Send Invitation
      </Button>
    </form>
  );
}
