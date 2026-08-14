'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Clock, Users, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import JobCard from '@/components/jobs/JobCard';
import { jobService } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { candidateService } from '@/services/candidateService';
import { Job, Company } from '@/types';
import { formatSalary, timeAgo, getInitials } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [match, setMatch] = useState<{ matchScore: number; matchedSkills: string[]; missingSkills: string[]; recommendation: string } | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([jobService.getJobById(id), jobService.getSimilarJobs(id)])
      .then(([jobRes, similarRes]) => {
        setJob(jobRes.job);
        setSimilarJobs(similarRes.jobs);
      })
      .catch(() => toast.error('Job not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user?.role === 'candidate' && id) {
      candidateService
        .getJobMatch(id)
        .then((res) => setMatch(res.match))
        .catch(() => {});
    }
  }, [user, id]);

  const handleApply = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'candidate') {
      toast.error('Only candidates can apply to jobs');
      return;
    }
    setApplying(true);
    try {
      await applicationService.applyToJob(id, coverLetter);
      toast.success('Application submitted!');
      setShowApplyForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
        <p className="text-[var(--text-secondary)]">Job not found.</p>
        <Link href="/jobs" className="mt-4 inline-block text-[var(--accent-primary)]">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const company = typeof job.companyId === 'object' ? (job.companyId as Company) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="lg">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] text-lg font-bold text-[var(--accent-primary)]">
                {company?.logo?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logo.url} alt={company.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(company?.name || job.title)
                )}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{job.title}</h1>
                {company && (
                  <Link href={`/companies/${company._id}`} className="text-[var(--accent-primary)]">
                    {company.name}
                  </Link>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {job.isRemote ? 'Remote' : job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> {job.type.replace('-', ' ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Posted {timeAgo(job.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {job.applicationsCount} applicants
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <p className="text-xl font-bold text-[var(--accent-primary)]">
                {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
              </p>
              {!showApplyForm ? (
                <Button size="lg" fullWidth onClick={() => setShowApplyForm(true)} className="mt-3">
                  Apply Now
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        {/* AI Match Score */}
        {user?.role === 'candidate' && match && (
          <Card className="mt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">AI Match Score</h2>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-[var(--accent-primary)]/30">
                <span className="text-xl font-bold text-[var(--accent-primary)]">{match.matchScore}%</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{match.recommendation}</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {match.matchedSkills.length === 0 && <span className="text-xs text-[var(--text-muted)]">None yet</span>}
                  {match.matchedSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Missing Skills</p>
                <div className="flex flex-wrap gap-2">
                  {match.missingSkills.length === 0 && <span className="text-xs text-[var(--text-muted)]">None — great fit!</span>}
                  {match.missingSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">
                      <XCircle className="h-3 w-3" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {showApplyForm && (
          <Card className="mt-6">
            <h3 className="font-semibold text-[var(--text-primary)]">Submit your application</h3>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Write a short cover letter (optional)..."
              className="mt-3 w-full rounded-xl px-4 py-3 text-sm"
            />
            <div className="mt-4 flex gap-3">
              <Button onClick={handleApply} loading={applying}>
                Submit Application
              </Button>
              <Button variant="secondary" onClick={() => setShowApplyForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <Card className="mt-6">
          <h2 className="font-semibold text-[var(--text-primary)]">Job Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{job.description}</p>

          {job.requirements?.length > 0 && (
            <>
              <h3 className="mt-6 font-semibold text-[var(--text-primary)]">Requirements</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-secondary)]">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" /> {r}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="mt-6 font-semibold text-[var(--text-primary)]">Required Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span key={s} className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                {s}
              </span>
            ))}
          </div>
        </Card>

        {similarJobs.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-5 font-display text-xl font-bold text-[var(--text-primary)]">Similar Jobs</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similarJobs.map((j, i) => (
                <JobCard key={j._id} job={j} index={i} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
