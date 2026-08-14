'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Video, MapPin, XCircle, CheckCircle2, Star, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InterviewStatusBadge from '@/components/dashboard/InterviewStatusBadge';
import { interviewService } from '@/services/interviewService';
import { Interview, Job, Company, User as UserType } from '@/types';
import { getInitials } from '@/utils/helpers';

const RANGE_TABS = [
  { key: '', label: 'All' },
  { key: 'today', label: "Today" },
  { key: 'upcoming', label: 'Upcoming' },
] as const;

const OUTCOME_OPTIONS = [
  { value: 'selected', label: 'Selected' },
  { value: 'next_round', label: 'Next Round' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'rejected', label: 'Rejected' },
];

export default function EmployerInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<(typeof RANGE_TABS)[number]['key']>('upcoming');
  const [cancelModal, setCancelModal] = useState<Interview | null>(null);
  const [reason, setReason] = useState('');
  const [outcomeModal, setOutcomeModal] = useState<Interview | null>(null);
  const [analytics, setAnalytics] = useState<{ total: number; scheduled: number; completed: number; cancelled: number; successRate: number } | null>(null);

  const fetchInterviews = () => {
    setLoading(true);
    interviewService
      .getEmployerInterviews({ range: range || undefined })
      .then((data) => setInterviews(data.interviews))
      .catch(() => toast.error('Failed to load interviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    interviewService.getEmployerAnalytics().then((res) => setAnalytics(res.analytics)).catch(() => {});
  }, []);

  const handleCancel = async () => {
    if (!cancelModal) return;
    try {
      await interviewService.cancel(cancelModal._id, reason);
      toast.success('Interview cancelled');
      setCancelModal(null);
      setReason('');
      fetchInterviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await interviewService.markCompleted(id);
      toast.success('Marked as completed');
      fetchInterviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleSetOutcome = async (outcome: string) => {
    if (!outcomeModal) return;
    try {
      await interviewService.setOutcome(outcomeModal._id, outcome);
      toast.success('Outcome recorded and candidate notified');
      setOutcomeModal(null);
      fetchInterviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set outcome');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Interview Management</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Interviews are scheduled from a candidate's application — open an applicant and choose "Schedule Interview".
        </p>
      </div>

      {analytics && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Interviews', value: analytics.total },
            { label: 'Currently Scheduled', value: analytics.scheduled },
            { label: 'Completed', value: analytics.completed },
            { label: 'Success Rate', value: `${analytics.successRate}%` },
          ].map((stat) => (
            <Card key={stat.label}>
              <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--text-muted)]" />
        {RANGE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setRange(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              range === t.key ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'glass-card text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">No interviews in this view.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview, i) => {
            const job = typeof interview.jobId === 'object' ? (interview.jobId as Job) : null;
            const candidate = typeof interview.candidateId === 'object' ? (interview.candidateId as UserType) : null;

            return (
              <motion.div key={interview._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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
                        <h3 className="font-semibold text-[var(--text-primary)]">{candidate?.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{job?.title}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {new Date(interview.date).toDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {interview.startTime} - {interview.endTime}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            {interview.meetingLink ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            {interview.interviewType.replace('-', ' ')} · {interview.interviewRound}
                          </span>
                        </div>
                      </div>
                    </div>
                    <InterviewStatusBadge status={interview.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {interview.status !== 'completed' && interview.status !== 'cancelled' && (
                      <>
                        <Button size="sm" onClick={() => handleComplete(interview._id)} icon={<CheckCircle2 className="h-4 w-4" />}>
                          Mark Completed
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setCancelModal(interview)} icon={<XCircle className="h-4 w-4" />}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {interview.status === 'completed' && (
                      <Button size="sm" onClick={() => setOutcomeModal(interview)} icon={<Star className="h-4 w-4" />}>
                        {interview.outcome && interview.outcome !== 'pending' ? `Outcome: ${interview.outcome}` : 'Set Outcome'}
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
        {cancelModal && (
          <Modal onClose={() => setCancelModal(null)}>
            <h3 className="font-semibold text-[var(--text-primary)]">Cancel Interview</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">The candidate will be notified immediately.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-xl px-4 py-3 text-sm"
              placeholder="Reason for cancellation..."
            />
            <div className="mt-4 flex gap-3">
              <Button variant="danger" onClick={handleCancel}>Confirm Cancel</Button>
              <Button variant="secondary" onClick={() => setCancelModal(null)}>Back</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {outcomeModal && (
          <Modal onClose={() => setOutcomeModal(null)}>
            <h3 className="font-semibold text-[var(--text-primary)]">Set Interview Outcome</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">The candidate will receive an email and notification.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {OUTCOME_OPTIONS.map((o) => (
                <Button key={o.value} variant="secondary" onClick={() => handleSetOutcome(o.value)}>
                  {o.label}
                </Button>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-md rounded-2xl p-6"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
