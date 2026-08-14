'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import { candidateService } from '@/services/candidateService';
import { Job } from '@/types';
import { formatSalary, getInitials } from '@/utils/helpers';

export default function AIMatchingPage() {
  const [jobs, setJobs] = useState<{ job: Job; matchScore: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidateService
      .getRecommendedJobs()
      .then((res) => setJobs(res.jobs))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-[var(--accent-primary)]" />
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">AI Job Matching</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Ranked by how well your profile matches each role's requirements.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">
            No matches yet — complete your{' '}
            <Link href="/dashboard/candidate/profile" className="text-[var(--accent-primary)]">
              profile
            </Link>{' '}
            and upload a resume to get AI-ranked recommendations.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map(({ job, matchScore }) => (
            <Link key={job._id} href={`/jobs/${job._id}`}>
              <Card className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card-alt)] text-sm font-bold text-[var(--accent-primary)]">
                    {getInitials(job.title)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{job.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {job.location} · {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center">
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-full border-4"
                    style={{ borderColor: `color-mix(in srgb, var(--accent-primary) ${matchScore}%, var(--border-color))` }}
                  >
                    <span className="text-xs font-bold text-[var(--accent-primary)]">{matchScore}%</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
