'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import { employerService, EmployerAnalytics } from '@/services/employerService';
import { interviewService } from '@/services/interviewService';

export default function EmployerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<EmployerAnalytics | null>(null);
  const [interviewStats, setInterviewStats] = useState<{ total: number; completed: number; successRate: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([employerService.getAnalytics(), interviewService.getEmployerAnalytics()])
      .then(([empRes, intRes]) => {
        setAnalytics(empRes.analytics);
        setInterviewStats(intRes.analytics);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  const jobChartData = (analytics?.topJobsByApplicants || []).map((j) => ({
    name: j.title.length > 18 ? j.title.slice(0, 18) + '…' : j.title,
    applicants: j.applicationsCount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Hiring pipeline performance across all your jobs.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Applications', value: analytics?.totals.totalApplications ?? 0 },
          { label: 'Shortlist Rate', value: analytics?.totals.totalApplications ? `${Math.round(((analytics.totals.shortlisted) / analytics.totals.totalApplications) * 100)}%` : '0%' },
          { label: 'Interviews Completed', value: interviewStats?.completed ?? 0 },
          { label: 'Interview Success Rate', value: `${interviewStats?.successRate ?? 0}%` },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Applicants by Job</h2>
        {jobChartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">No application data yet.</p>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={jobChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card-alt)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="applicants" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
