'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import { Company } from '@/types';
import { getInitials, timeAgo } from '@/utils/helpers';

export default function AdminEmployersPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const fetchCompanies = () => {
    setLoading(true);
    const verifiedParam = filter === 'verified' ? true : filter === 'unverified' ? false : undefined;
    adminService
      .getCompanies(verifiedParam)
      .then((res) => setCompanies(res.companies))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load companies'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleVerify = async (id: string) => {
    try {
      await adminService.verifyCompany(id);
      toast.success('Company verified — the employer has been notified');
      fetchCompanies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify company');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Employers &amp; Companies</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Review and verify employer company profiles.</p>
      </div>

      <div className="flex gap-2">
        {[{ key: '', label: 'All' }, { key: 'unverified', label: 'Pending Verification' }, { key: 'verified', label: 'Verified' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filter === t.key ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'glass-card text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : companies.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">No companies in this view.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {companies.map((c) => (
            <Card key={c._id} padding="sm" hover={false}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card-alt)] text-xs font-bold text-[var(--accent-primary)]">
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                      {c.name}
                      {c.verified && <BadgeCheck className="h-3.5 w-3.5 text-[var(--accent-primary)]" />}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {c.industry || 'General'} · Joined {timeAgo(c.createdAt)}
                    </p>
                  </div>
                </div>
                {!c.verified && (
                  <Button size="sm" onClick={() => handleVerify(c._id)} icon={<BadgeCheck className="h-4 w-4" />}>
                    Verify
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
