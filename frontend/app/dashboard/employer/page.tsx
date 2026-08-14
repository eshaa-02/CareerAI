'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Users, CheckCircle2, XCircle, PlusCircle, BadgeCheck, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { employerService, EmployerAnalytics } from '@/services/employerService';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<EmployerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employerService
      .getAnalytics()
      .then((res) => setAnalytics(res.analytics))
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const totals = analytics?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Here's how your hiring pipeline is doing.</p>
        </div>
        <Link href="/dashboard/employer/post-job">
          <Button icon={<PlusCircle className="h-4 w-4" />}>Post a Job</Button>
        </Link>
      </div>

      {analytics && !analytics.companyVerified && (
        <Card className="flex items-center gap-3 border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Your company isn't verified yet</p>
            <p className="text-xs text-[var(--text-muted)]">
              Verified companies get more visibility and candidate trust. Complete your company profile to request verification.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <Briefcase className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.activeJobs ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Active job postings</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <Users className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.totalApplications ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Total applications</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <CheckCircle2 className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.shortlisted ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Shortlisted candidates</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <XCircle className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.accepted ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Offers accepted</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Top Jobs by Applicants</h2>
        {!analytics || analytics.topJobsByApplicants.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            You haven't posted any jobs yet.{' '}
            <Link href="/dashboard/employer/post-job" className="text-[var(--accent-primary)]">
              Post your first job
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {analytics.topJobsByApplicants.map((job) => (
              <div key={job._id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{job.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{job.views} views</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[var(--accent-primary)]/15 px-3 py-1 text-xs font-bold text-[var(--accent-primary)]">
                    {job.applicationsCount} applicants
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      job.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/dashboard/employer/jobs" className="block rounded-xl border border-[var(--border-color)] p-3 text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40">
              Manage all job postings
            </Link>
            <Link href="/dashboard/employer/applicants" className="block rounded-xl border border-[var(--border-color)] p-3 text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40">
              Review applicants
            </Link>
            <Link href="/dashboard/employer/interviews" className="block rounded-xl border border-[var(--border-color)] p-3 text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40">
              Manage interviews
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-[var(--accent-primary)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Pipeline Summary</h3>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Closed jobs</span>
              <span className="font-medium text-[var(--text-primary)]">{totals?.closedJobs ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Rejected applications</span>
              <span className="font-medium text-[var(--text-primary)]">{totals?.rejected ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Total jobs posted</span>
              <span className="font-medium text-[var(--text-primary)]">{totals?.totalJobs ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
