'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, BadgeCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import { companyService } from '@/services/companyService';
import { Company } from '@/types';
import { getInitials } from '@/utils/helpers';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCompanies = (query = '') => {
    setLoading(true);
    companyService
      .getCompanies({ search: query })
      .then((data) => setCompanies(data.companies))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Companies Hiring Now</h1>
      <p className="mt-1 text-[var(--text-secondary)]">Explore verified companies actively growing their teams.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchCompanies(search);
        }}
        className="glass-card mt-6 flex items-center gap-2 rounded-2xl p-2"
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies by name or industry"
          className="w-full border-none bg-transparent p-2 text-sm outline-none"
        />
      </form>

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <p className="mt-16 text-center text-[var(--text-muted)]">No companies found.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c._id} href={`/companies/${c._id}`}>
              <Card className="h-full">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] text-sm font-bold text-[var(--accent-primary)]">
                    {c.logo?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo.url} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(c.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold text-[var(--text-primary)]">{c.name}</h3>
                      {c.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />}
                    </div>
                    <p className="truncate text-xs text-[var(--text-muted)]">{c.industry || 'General'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {c.location || 'Remote'}
                  </span>
                  <span className="font-semibold text-[var(--accent-primary)]">{c.openJobs ?? 0} open jobs</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
