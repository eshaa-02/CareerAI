'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import api from '@/services/api';

interface AdminInterviewAnalytics {
  total: number;
  scheduledToday: number;
  completed: number;
  cancelled: number;
  successRate: number;
  byCompany: { companyName: string; count: number }[];
}

export default function AdminReportsPage() {
  const [analytics, setAnalytics] = useState<AdminInterviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/interviews/admin/analytics')
      .then(({ data }) => setAnalytics(data.analytics))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Platform-wide interview activity and hiring outcomes.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <CalendarClock className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{analytics?.total ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Total interviews</p>
        </Card>
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <CalendarClock className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{analytics?.scheduledToday ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Scheduled today</p>
        </Card>
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <CheckCircle2 className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{analytics?.completed ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Completed</p>
        </Card>
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{analytics?.successRate ?? 0}%</p>
          <p className="text-xs text-[var(--text-muted)]">Success rate</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Interviews by Company</h2>
        {!analytics || analytics.byCompany.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">No interview data yet.</p>
        ) : (
          <div className="space-y-2">
            {analytics.byCompany.map((c) => (
              <div key={c.companyName} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-3">
                <span className="text-sm text-[var(--text-primary)]">{c.companyName}</span>
                <span className="text-sm font-semibold text-[var(--accent-primary)]">{c.count} interviews</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          Cancelled interviews: <span className="font-semibold text-[var(--text-primary)]">{analytics?.cancelled ?? 0}</span>. Recruiter-level
          performance breakdown is not yet implemented — this view is company-level only.
        </p>
      </Card>
    </div>
  );
}
