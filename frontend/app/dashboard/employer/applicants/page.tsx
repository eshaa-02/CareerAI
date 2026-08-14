'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CalendarClock, CheckCircle2, XCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ScheduleInterviewForm from '@/components/dashboard/ScheduleInterviewForm';
import { applicationService } from '@/services/applicationService';
import { API_URL } from '@/services/api';
import { Application, Job, User as UserType } from '@/types';
import { getInitials, timeAgo } from '@/utils/helpers';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]',
  shortlisted: 'bg-blue-500/15 text-blue-400',
  accepted: 'bg-emerald-500/15 text-emerald-500',
  rejected: 'bg-red-500/15 text-red-400',
  withdrawn: 'bg-[var(--bg-card-alt)] text-[var(--text-muted)]',
};

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const jobIdFilter = searchParams.get('jobId');

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [scheduleModal, setScheduleModal] = useState<Application | null>(null);

  const getResumeUrl = (url: string) => {
    if (!url) return '';

    // Already complete URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // API_URL = http://localhost:5000/api
    // We need backend root = http://localhost:5000
    const backendUrl = API_URL.replace(/\/api\/?$/, '');

    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const fetchApplicants = () => {
    setLoading(true);
    applicationService
      .getAllApplicantsForEmployer(statusFilter || undefined)
      .then((res) => setApplications(res.applications))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load applicants'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = jobIdFilter
    ? applications.filter((a) => (typeof a.jobId === 'object' ? (a.jobId as Job)._id : a.jobId) === jobIdFilter)
    : applications;

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await applicationService.updateStatus(id, status);
      toast.success(`Marked as ${status}`);
      fetchApplicants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Applicants</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {filtered.length} applicant{filtered.length !== 1 ? 's' : ''} {jobIdFilter ? 'for this job' : 'across all your jobs'}
        </p>
      </div>

      <div className="flex gap-2">
        {['', 'pending', 'shortlisted', 'accepted', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${statusFilter === s ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'glass-card text-[var(--text-secondary)]'
              }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">No applicants in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => {
            const candidate = typeof app.candidateId === 'object' ? (app.candidateId as UserType) : null;
            const job = typeof app.jobId === 'object' ? (app.jobId as Job) : null;

            return (
              <motion.div key={app._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] text-sm font-bold text-[var(--accent-primary)]">
                        {candidate?.avatar?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={candidate.avatar.url} alt={candidate.name} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(candidate?.name || 'CN')
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{candidate?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Applied for {job?.title} · {timeAgo(app.createdAt)}
                        </p>
                        {candidate?.skills && candidate.skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {candidate.skills.slice(0, 5).map((s) => (
                              <span key={s} className="rounded-full bg-[var(--bg-card-alt)] px-2.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-[var(--accent-primary)]/15 px-3 py-1 text-xs font-bold text-[var(--accent-primary)]">
                        {app.matchScore}% match
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-color)] pt-4">
                    <a
                      href={getResumeUrl(app.resume.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<FileText className="h-4 w-4" />}
                      >
                        View Resume
                      </Button>
                    </a>
                    {app.status === 'pending' && (
                      <Button size="sm" onClick={() => handleStatusUpdate(app._id, 'shortlisted')} icon={<Star className="h-4 w-4" />}>
                        Shortlist
                      </Button>
                    )}
                    {app.status === 'shortlisted' && (
                      <>
                        <Button size="sm" onClick={() => setScheduleModal(app)} icon={<CalendarClock className="h-4 w-4" />}>
                          Schedule Interview
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(app._id, 'accepted')} icon={<CheckCircle2 className="h-4 w-4" />}>
                          Accept
                        </Button>
                      </>
                    )}
                    {app.status !== 'rejected' && app.status !== 'accepted' && (
                      <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(app._id, 'rejected')} icon={<XCircle className="h-4 w-4" />}>
                        Reject
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {scheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setScheduleModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card my-8 w-full max-w-lg rounded-2xl p-6"
            >
              <h3 className="mb-4 font-semibold text-[var(--text-primary)]">Schedule Interview</h3>
              <ScheduleInterviewForm
                applicationId={scheduleModal._id}
                onScheduled={() => {
                  setScheduleModal(null);
                  fetchApplicants();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
      <ApplicantsContent />
    </Suspense>
  );
}
