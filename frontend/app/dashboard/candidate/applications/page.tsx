'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { candidateService } from '@/services/candidateService';
import { applicationService } from '@/services/applicationService';
import { Application, Job, Company } from '@/types';
import { formatSalary, timeAgo, getInitials } from '@/utils/helpers';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]',
  shortlisted: 'bg-blue-500/15 text-blue-400',
  accepted: 'bg-emerald-500/15 text-emerald-500',
  rejected: 'bg-red-500/15 text-red-400',
  withdrawn: 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]',
};

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchApplications = () => {
    setLoading(true);
    candidateService
      .getMyApplications()
      .then((res) => setApplications(res.applications))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load applications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (id: string) => {
    try {
      await applicationService.withdrawApplication(id);
      toast.success('Application withdrawn');
      fetchApplications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to withdraw');
    }
  };

  const filtered = filter ? applications.filter((a) => a.status === filter) : applications;

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Applied Jobs</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Track the status of every application you've sent.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'glass-card text-[var(--text-secondary)]'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">No applications in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => {
            const job = typeof app.jobId === 'object' ? (app.jobId as Job) : null;
            const company = job && typeof job.companyId === 'object' ? (job.companyId as Company) : null;

            return (
              <motion.div key={app._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card-alt)] text-sm font-bold text-[var(--accent-primary)]">
                        {getInitials(company?.name || job?.title || 'JB')}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{job?.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {company?.name} · Applied {timeAgo(app.createdAt)}
                        </p>
                        {job && (
                          <p className="mt-1 text-xs text-[var(--accent-primary)]">
                            {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[var(--accent-primary)]/15 px-3 py-1 text-xs font-bold text-[var(--accent-primary)]">
                        {app.matchScore}% match
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[app.status]}`}>
                        {app.status}
                      </span>
                      {app.status === 'pending' && (
                        <Button size="sm" variant="danger" onClick={() => handleWithdraw(app._id)}>
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
