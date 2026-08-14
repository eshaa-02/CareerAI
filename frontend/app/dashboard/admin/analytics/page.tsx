'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import { adminService, AdminAnalytics } from '@/services/adminService';

const COLORS = ['#34d399', '#6ee7b7', '#059669', '#a7f3d0', '#10b981', '#047857'];

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAnalytics()
      .then((res) => setAnalytics(res.analytics))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  const growthData = (analytics?.userGrowth || []).map((g) => ({
    month: `${g._id.month}/${g._id.year}`,
    users: g.count,
  }));

  const categoryData = (analytics?.jobsByCategory || []).map((c) => ({ name: c._id || 'Uncategorized', value: c.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Platform Analytics</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Growth and activity across the entire platform.</p>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">User Growth (Last 6 Months)</h2>
        {growthData.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Not enough data yet.</p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="users" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Jobs by Category</h2>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">No job data yet.</p>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.name}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Applications by Status</h2>
          <div className="space-y-2">
            {(analytics?.applicationsByStatus || []).map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] p-3">
                <span className="text-sm capitalize text-[var(--text-primary)]">{s._id}</span>
                <span className="text-sm font-semibold text-[var(--accent-primary)]">{s.count}</span>
              </div>
            ))}
            {(!analytics || analytics.applicationsByStatus.length === 0) && (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">No applications yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
