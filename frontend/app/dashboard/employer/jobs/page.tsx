'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Users, Trash2, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { jobService } from '@/services/jobService';
import { Job } from '@/types';
import { formatSalary, timeAgo } from '@/utils/helpers';

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = () => {
    setLoading(true);
    jobService
      .getMyJobs(statusFilter || undefined)
      .then((res) => setJobs(res.jobs))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleToggleStatus = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await jobService.updateJob(job._id, { status: newStatus });
      toast.success(`Job marked as ${newStatus}`);
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update job');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job posting permanently? This cannot be undone.')) return;
    try {
      await jobService.deleteJob(id);
      toast.success('Job deleted');
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Manage Jobs</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{jobs.length} job posting{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/employer/post-job">
          <Button icon={<PlusCircle className="h-4 w-4" />}>Post a Job</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {['', 'active', 'closed', 'draft'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
              statusFilter === s ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'glass-card text-[var(--text-secondary)]'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : jobs.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">No jobs in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job._id}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">{job.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        job.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {job.location} · {formatSalary(job.salary.min, job.salary.max, job.salary.currency)} · Posted {timeAgo(job.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Eye className="h-3.5 w-3.5" /> {job.views}
                  </span>
                  <Link href={`/dashboard/employer/applicants?jobId=${job._id}`}>
                    <Button size="sm" variant="secondary" icon={<Users className="h-4 w-4" />}>
                      {job.applicationsCount} applicants
                    </Button>
                  </Link>
                  <Button size="sm" variant="secondary" onClick={() => handleToggleStatus(job)}>
                    {job.status === 'active' ? 'Close' : 'Reopen'}
                  </Button>
                  <button onClick={() => handleDelete(job._id)} className="text-[var(--text-muted)] hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
