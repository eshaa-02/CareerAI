'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Briefcase, Bookmark, TrendingUp, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import { candidateService } from '@/services/candidateService';
import { useAuth } from '@/context/AuthContext';
import { Job, Application } from '@/types';
import { formatSalary, getInitials } from '@/utils/helpers';

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const [completion, setCompletion] = useState(0);
  const [recommended, setRecommended] = useState<{ job: Job; matchScore: number }[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      candidateService.getMyProfile(),
      candidateService.getRecommendedJobs(),
      candidateService.getMyApplications(),
      candidateService.getSavedJobs(),
    ])
      .then(([profileRes, recRes, appsRes, savedRes]) => {
        setCompletion(profileRes.completionPercentage);
        setRecommended(recRes.jobs.slice(0, 4));
        setApplications(appsRes.applications);
        setSavedCount(savedRes.jobs.length);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = {
    pending: applications.filter((a) => a.status === 'pending').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Here's what's happening with your job search.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-[var(--text-muted)]">Profile Completion</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-14 w-14 -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="var(--border-color)" strokeWidth="5" fill="none" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="var(--accent-primary)"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - completion / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                {completion}%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {completion < 100 ? 'Almost there!' : 'Complete!'}
              </p>
              <Link href="/dashboard/candidate/profile" className="text-xs text-[var(--accent-primary)]">
                Complete profile →
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <Briefcase className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{applications.length}</p>
          <p className="text-xs text-[var(--text-muted)]">Applications sent</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{statusCounts.shortlisted}</p>
          <p className="text-xs text-[var(--text-muted)]">Shortlisted</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <Bookmark className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{savedCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Saved jobs</p>
        </Card>
      </div>

      {/* AI Recommended Jobs */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">AI-Recommended For You</h2>
          </div>
          <Link href="/dashboard/candidate/matching" className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)]">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recommended.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            Complete your profile to get AI-matched job recommendations.
          </p>
        ) : (
          <div className="space-y-3">
            {recommended.map(({ job, matchScore }) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] p-4 transition-colors hover:border-[var(--accent-primary)]/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card-alt)] text-xs font-bold text-[var(--accent-primary)]">
                    {getInitials(job.title)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{job.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--accent-primary)]/15 px-3 py-1 text-xs font-bold text-[var(--accent-primary)]">
                  {matchScore}% match
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Applications */}
      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Recent Applications</h2>
        {applications.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            You haven't applied to any jobs yet.{' '}
            <Link href="/jobs" className="text-[var(--accent-primary)]">
              Browse jobs
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 5).map((app) => {
              const job = typeof app.jobId === 'object' ? (app.jobId as Job) : null;
              return (
                <div key={app._id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{job?.title || 'Job'}</p>
                    <p className="text-xs text-[var(--text-muted)]">Match score: {app.matchScore}%</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      app.status === 'accepted'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : app.status === 'rejected'
                        ? 'bg-red-500/15 text-red-400'
                        : app.status === 'shortlisted'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
