'use client';

import { useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import { Job, Company, User as UserType } from '@/types';
import { formatSalary, timeAgo } from '@/utils/helpers';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = () => {
    setLoading(true);
    adminService
      .getJobs(statusFilter || undefined)
      .then((res) => setJobs(res.jobs))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleClose = async (id: string) => {
    if (!confirm('Close this job posting?')) return;
    try {
      await adminService.closeJob(id);
      toast.success('Job closed');
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close job');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Jobs Management</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{jobs.length} job postings across the platform</p>
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
        <div className="space-y-2">
          {jobs.map((job) => {
            const company = typeof job.companyId === 'object' ? (job.companyId as Company) : null;
            const employer = typeof job.employerId === 'object' ? (job.employerId as UserType) : null;
            return (
              <Card key={job._id} padding="sm" hover={false}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{job.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {company?.name} · {employer?.email} · Posted {timeAgo(job.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--accent-primary)]">
                      {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${job.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]'}`}>
                      {job.status}
                    </span>
                    {job.status === 'active' && (
                      <Button size="sm" variant="danger" onClick={() => handleClose(job._id)} icon={<Ban className="h-4 w-4" />}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
