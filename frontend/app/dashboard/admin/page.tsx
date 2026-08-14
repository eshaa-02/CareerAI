'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Briefcase, Building2, FileCheck2, ShieldCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import { adminService, AdminAnalytics } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAnalytics()
      .then((res) => setAnalytics(res.analytics))
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
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Platform-wide overview.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <Users className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.users ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {totals?.candidates ?? 0} candidates · {totals?.employers ?? 0} employers
          </p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <Briefcase className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.activeJobs ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Active of {totals?.jobs ?? 0} total jobs</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <Building2 className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.companies ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">{totals?.verifiedCompanies ?? 0} verified</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
            <FileCheck2 className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{totals?.applications ?? 0}</p>
          <p className="text-xs text-[var(--text-muted)]">Total applications</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Applications by Status</h2>
          {!analytics || analytics.applicationsByStatus.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">No applications yet.</p>
          ) : (
            <div className="space-y-2">
              {analytics.applicationsByStatus.map((s) => (
                <div key={s._id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-3">
                  <span className="text-sm capitalize text-[var(--text-primary)]">{s._id}</span>
                  <span className="text-sm font-semibold text-[var(--accent-primary)]">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Top Job Categories</h2>
          {!analytics || analytics.jobsByCategory.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">No jobs posted yet.</p>
          ) : (
            <div className="space-y-2">
              {analytics.jobsByCategory.map((c) => (
                <div key={c._id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-3">
                  <span className="text-sm text-[var(--text-primary)]">{c._id || 'Uncategorized'}</span>
                  <span className="text-sm font-semibold text-[var(--accent-primary)]">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--accent-primary)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">Quick Actions</h3>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link href="/dashboard/admin/users" className="rounded-xl border border-[var(--border-color)] p-3 text-center text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40">
            Manage Users
          </Link>
          <Link href="/dashboard/admin/employers" className="rounded-xl border border-[var(--border-color)] p-3 text-center text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40">
            Verify Companies
          </Link>
          <Link href="/dashboard/admin/jobs" className="rounded-xl border border-[var(--border-color)] p-3 text-center text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40">
            Moderate Jobs
          </Link>
        </div>
      </Card>
    </div>
  );
}
