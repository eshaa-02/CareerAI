'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { jobService } from '@/services/jobService';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const EXPERIENCE_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];

export default function PostJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    requirements: [] as string[],
    location: '',
    isRemote: false,
    type: 'full-time',
    experience: 'mid',
    category: 'Engineering',
    salaryMin: 0,
    salaryMax: 0,
    vacancies: 1,
    deadline: '',
  });

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setForm({ ...form, requirements: [...form.requirements, requirementInput.trim()] });
      setRequirementInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.skills.length === 0) {
      toast.error('Add at least one required skill');
      return;
    }
    if (!form.deadline) {
      toast.error('Set an application deadline');
      return;
    }
    setSubmitting(true);
    try {
      await jobService.createJob({
        title: form.title,
        description: form.description,
        skills: form.skills,
        requirements: form.requirements,
        location: form.location,
        isRemote: form.isRemote,
        type: form.type as never,
        experience: form.experience as never,
        category: form.category,
        salary: { min: form.salaryMin, max: form.salaryMax, currency: 'USD', isNegotiable: false },
        vacancies: form.vacancies,
        deadline: form.deadline as never,
      });
      toast.success('Job posted successfully');
      router.push('/dashboard/employer/jobs');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Post a Job</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Candidates matching your skills will be notified automatically.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Job Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Backend Engineer" className="w-full rounded-xl px-4 py-2.5 text-sm" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Description</label>
            <textarea required rows={5} minLength={20} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role, team, and impact..." className="w-full rounded-xl px-4 py-2.5 text-sm" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Required Skills</label>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="e.g. React"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm"
              />
              <Button type="button" variant="secondary" onClick={addSkill} icon={<Plus className="h-4 w-4" />}>
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-[var(--accent-primary)]/15 px-3 py-1 text-xs text-[var(--accent-primary)]">
                  {s}
                  <button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Requirements</label>
            <div className="flex gap-2">
              <input
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                placeholder="e.g. 5+ years experience"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm"
              />
              <Button type="button" variant="secondary" onClick={addRequirement} icon={<Plus className="h-4 w-4" />}>
                Add
              </Button>
            </div>
            <ul className="mt-2 space-y-1">
              {form.requirements.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg-card-alt)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
                  {r}
                  <button type="button" onClick={() => setForm({ ...form, requirements: form.requirements.filter((_, idx) => idx !== i) })}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Location</label>
              <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm({ ...form, isRemote: e.target.checked })} /> Remote position
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Job Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm">
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Experience Level</label>
              <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm">
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Min Salary (USD)</label>
              <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Max Salary (USD)</label>
              <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Vacancies</label>
              <input type="number" min={1} value={form.vacancies} onChange={(e) => setForm({ ...form, vacancies: Number(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Application Deadline</label>
              <input required type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Post Job
          </Button>
        </Card>
      </form>
    </div>
  );
}
