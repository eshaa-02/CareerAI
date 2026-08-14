'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Globe, BadgeCheck, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import JobCard from '@/components/jobs/JobCard';
import { companyService } from '@/services/companyService';
import { Company, Job } from '@/types';
import { getInitials } from '@/utils/helpers';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    companyService
      .getCompanyById(id)
      .then((data) => {
        setCompany(data.company);
        setJobs(data.jobs);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  if (!company) {
    return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-[var(--text-secondary)]">Company not found.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Card padding="lg">
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] text-2xl font-bold text-[var(--accent-primary)]">
            {company.logo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo.url} alt={company.name} className="h-full w-full object-cover" />
            ) : (
              getInitials(company.name)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{company.name}</h1>
              {company.verified && <BadgeCheck className="h-5 w-5 text-[var(--accent-primary)]" />}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{company.industry || 'General'}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
              {company.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {company.location}
                </span>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--accent-primary)]">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {company.companySize && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {company.companySize} employees
                </span>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{company.description}</p>
        )}
      </Card>

      <div className="mt-10">
        <h2 className="mb-5 font-display text-xl font-bold text-[var(--text-primary)]">
          Open Positions ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
          <p className="text-[var(--text-muted)]">No active job postings right now.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {jobs.map((job, i) => (
              <JobCard key={job._id} job={{ ...job, companyId: company }} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
