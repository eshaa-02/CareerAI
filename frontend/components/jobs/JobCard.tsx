'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Clock, Bookmark } from 'lucide-react';
import { Job, Company } from '@/types';
import { formatSalary, timeAgo, getInitials } from '@/utils/helpers';
import Card from '@/components/ui/Card';

interface JobCardProps {
  job: Job;
  onSave?: (jobId: string) => void;
  saved?: boolean;
  index?: number;
}

export default function JobCard({ job, onSave, saved, index = 0 }: JobCardProps) {
  const company = typeof job.companyId === 'object' ? (job.companyId as Company) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="group relative">
        {onSave && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onSave(job._id);
            }}
            className="absolute right-5 top-5 z-10 text-[var(--text-muted)] transition-colors hover:text-[var(--accent-primary)]"
          >
            <Bookmark className={`h-5 w-5 ${saved ? 'fill-[var(--accent-primary)] text-[var(--accent-primary)]' : ''}`} />
          </button>
        )}
        <Link href={`/jobs/${job._id}`} className="block">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] text-sm font-bold text-[var(--accent-primary)]">
              {company?.logo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo.url} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(company?.name || job.title)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate pr-6 text-lg font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]">
                {job.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{company?.name || 'Confidential Company'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.isRemote ? 'Remote' : job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {job.type.replace('-', ' ')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {timeAgo(job.createdAt)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
            <span className="font-semibold text-[var(--accent-primary)]">
              {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
            </span>
            <span className="text-xs font-medium text-[var(--text-muted)] capitalize">{job.experience} level</span>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}
