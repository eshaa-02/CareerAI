'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Download,
  CheckCircle2,
  XCircle,
  CalendarClock,
  ExternalLink,
  FileText,
  Sparkles,
  X,
  Phone,
  Building2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CountdownTimer from '@/components/dashboard/CountdownTimer';
import InterviewStatusBadge from '@/components/dashboard/InterviewStatusBadge';

import { interviewService } from '@/services/interviewService';
import { Interview, Job, Company } from '@/types';
import { getInitials } from '@/utils/helpers';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

export default function CandidateInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] =
    useState<(typeof TABS)[number]['key']>('upcoming');

  const [rescheduleModal, setRescheduleModal] =
    useState<Interview | null>(null);

  const [declineModal, setDeclineModal] =
    useState<Interview | null>(null);

  // Single details modal
  const [detailsModal, setDetailsModal] =
    useState<Interview | null>(null);

  const [note, setNote] = useState('');

  // --------------------------------------------------
  // Fetch interviews
  // --------------------------------------------------

  const fetchInterviews = () => {
    setLoading(true);

    interviewService
      .getCandidateInterviews()
      .then((data) => {
        setInterviews(data.interviews);
      })
      .catch((err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Failed to load interviews'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // --------------------------------------------------
  // Filter interviews
  // --------------------------------------------------

  const filtered = interviews.filter((interview) => {
    if (tab === 'completed') {
      return interview.status === 'completed';
    }

    if (tab === 'cancelled') {
      return (
        interview.status === 'cancelled' ||
        interview.status === 'declined'
      );
    }

    return ![
      'completed',
      'cancelled',
      'declined',
    ].includes(interview.status);
  });

  // --------------------------------------------------
  // Accept
  // --------------------------------------------------

  const handleAccept = async (id: string) => {
    try {
      await interviewService.respond(id, 'accepted');

      toast.success('Interview accepted');

      fetchInterviews();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to respond'
      );
    }
  };

  // --------------------------------------------------
  // Decline
  // --------------------------------------------------

  const handleDecline = async () => {
    if (!declineModal) return;

    try {
      await interviewService.respond(
        declineModal._id,
        'declined',
        note
      );

      toast.success('Interview declined');

      setDeclineModal(null);
      setNote('');

      fetchInterviews();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to decline'
      );
    }
  };

  // --------------------------------------------------
  // Request Reschedule
  // --------------------------------------------------

  const handleRequestReschedule = async () => {
    if (!rescheduleModal) return;

    try {
      await interviewService.respond(
        rescheduleModal._id,
        'reschedule_requested',
        note
      );

      toast.success('Reschedule request sent');

      setRescheduleModal(null);
      setNote('');

      fetchInterviews();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to request reschedule'
      );
    }
  };

  // --------------------------------------------------
  // Join Interview
  // --------------------------------------------------

  const handleJoin = async (interview: Interview) => {
    try {
      await interviewService.join(interview._id);

      if (interview.meetingLink) {
        window.open(
          interview.meetingLink,
          '_blank',
          'noopener,noreferrer'
        );
      } else {
        toast.error('Meeting link is not available');
      }

      fetchInterviews();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to join interview'
      );
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          My Interviews
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Track, prepare for, and join your scheduled interviews.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === t.key
                ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]'
                : 'glass-card text-[var(--text-secondary)]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-[var(--text-muted)]">
            No {tab} interviews.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((interview, i) => {
            const job =
              typeof interview.jobId === 'object'
                ? (interview.jobId as Job)
                : null;

            const company =
              typeof interview.companyId === 'object'
                ? (interview.companyId as Company)
                : null;

            const isPending =
              interview.candidateResponse?.status === 'pending' &&
              tab === 'upcoming';

            return (
              <motion.div
                key={interview._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  {/* Top section */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    {/* Company + Job */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] text-sm font-bold text-[var(--accent-primary)]">
                        {company?.logo?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={company.logo.url}
                            alt={company.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(
                            company?.name ||
                            job?.title ||
                            'JB'
                          )
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {job?.title || 'Interview'}
                        </h3>

                        <p className="text-sm text-[var(--text-secondary)]">
                          {company?.name || 'Company'}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                          {/* Date */}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />

                            {new Date(
                              interview.date
                            ).toDateString()}
                          </span>

                          {/* Time */}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />

                            {interview.startTime} -{' '}
                            {interview.endTime}

                            {interview.timezone && (
                              <span>
                                ({interview.timezone})
                              </span>
                            )}
                          </span>

                          {/* Type */}
                          <span className="flex items-center gap-1 capitalize">
                            {interview.interviewType ===
                              'on-site' ? (
                              <MapPin className="h-3.5 w-3.5" />
                            ) : interview.interviewType ===
                              'phone-call' ? (
                              <Phone className="h-3.5 w-3.5" />
                            ) : (
                              <Video className="h-3.5 w-3.5" />
                            )}

                            {interview.interviewType.replace(
                              /-/g,
                              ' '
                            )}

                            <span>·</span>

                            {interview.interviewRound?.replace(
                              /-/g,
                              ' '
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status + Countdown */}
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <InterviewStatusBadge
                        status={interview.status}
                      />

                      {tab === 'upcoming' && (
                        <CountdownTimer
                          targetDate={interview.date}
                          targetTime={interview.startTime}
                        />
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  {interview.instructions && (
                    <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-3 text-sm text-[var(--text-secondary)]">
                      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-[var(--text-muted)]">
                        <FileText className="h-3.5 w-3.5" />
                        Instructions
                      </p>

                      {interview.instructions}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* View Details */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setDetailsModal(interview)
                      }
                      icon={
                        <FileText className="h-4 w-4" />
                      }
                    >
                      View Details
                    </Button>

                    {/* Pending actions */}
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAccept(interview._id)
                          }
                          icon={
                            <CheckCircle2 className="h-4 w-4" />
                          }
                        >
                          Accept
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setRescheduleModal(interview)
                          }
                          icon={
                            <CalendarClock className="h-4 w-4" />
                          }
                        >
                          Request Reschedule
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setDeclineModal(interview)
                          }
                          icon={
                            <XCircle className="h-4 w-4" />
                          }
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {/* Join */}
                    {interview.candidateResponse?.status ===
                      'accepted' &&
                      interview.status !== 'completed' &&
                      interview.meetingLink && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleJoin(interview)
                          }
                          icon={
                            <ExternalLink className="h-4 w-4" />
                          }
                        >
                          Join Interview
                        </Button>
                      )}

                    {/* Calendar */}
                    <a
                      href={interviewService.getICSDownloadUrl(
                        interview._id
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={
                          <Download className="h-4 w-4" />
                        }
                      >
                        Add to Calendar
                      </Button>
                    </a>
                  </div>

                  {/* Completed result */}
                  {interview.status === 'completed' &&
                    interview.outcome &&
                    interview.outcome !== 'pending' && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent-primary)]/10 p-3">
                        <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />

                        <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
                          Result:{' '}
                          {interview.outcome.replace(
                            /_/g,
                            ' '
                          )}
                        </span>
                      </div>
                    )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ============================================================
          INTERVIEW DETAILS MODAL
          ============================================================ */}

      <AnimatePresence>
        {detailsModal && (
          <Modal
            onClose={() => setDetailsModal(null)}
            maxWidth="max-w-2xl"
          >
            {(() => {
              const job =
                typeof detailsModal.jobId === 'object'
                  ? (detailsModal.jobId as Job)
                  : null;

              const company =
                typeof detailsModal.companyId === 'object'
                  ? (detailsModal.companyId as Company)
                  : null;

              return (
                <>
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="pr-8">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                        Interview Details
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                        {job?.title || 'Interview'}
                      </h2>

                      <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Building2 className="h-4 w-4" />
                        {company?.name || 'Company'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setDetailsModal(null)
                      }
                      className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-alt)] hover:text-[var(--text-primary)]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Main Details */}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {/* Date */}
                    <DetailBox
                      label="Date"
                      icon={
                        <Calendar className="h-4 w-4" />
                      }
                    >
                      {detailsModal.date
                        ? new Date(
                          detailsModal.date
                        ).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : 'N/A'}
                    </DetailBox>

                    {/* Time */}
                    <DetailBox
                      label="Time"
                      icon={
                        <Clock className="h-4 w-4" />
                      }
                    >
                      <span>
                        {detailsModal.startTime || 'N/A'} -{' '}
                        {detailsModal.endTime || 'N/A'}
                      </span>

                      {detailsModal.timezone && (
                        <span className="mt-1 block text-xs font-normal text-[var(--text-muted)]">
                          {detailsModal.timezone}
                        </span>
                      )}
                    </DetailBox>

                    {/* Interview Type */}
                    <DetailBox
                      label="Interview Type"
                      icon={
                        detailsModal.interviewType ===
                          'on-site' ? (
                          <MapPin className="h-4 w-4" />
                        ) : detailsModal.interviewType ===
                          'phone-call' ? (
                          <Phone className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )
                      }
                    >
                      {detailsModal.interviewType
                        ?.replace(/-/g, ' ') || 'N/A'}
                    </DetailBox>

                    {/* Round */}
                    <DetailBox
                      label="Interview Round"
                      icon={
                        <Users className="h-4 w-4" />
                      }
                    >
                      {detailsModal.interviewRound
                        ?.replace(/-/g, ' ') || 'N/A'}
                    </DetailBox>

                    {/* Duration */}
                    {detailsModal.durationMinutes && (
                      <DetailBox
                        label="Duration"
                        icon={
                          <Clock className="h-4 w-4" />
                        }
                      >
                        {detailsModal.durationMinutes} minutes
                      </DetailBox>
                    )}

                    {/* Meeting Platform */}
                    {detailsModal.meetingPlatform && (
                      <DetailBox
                        label="Meeting Platform"
                        icon={
                          <Video className="h-4 w-4" />
                        }
                      >
                        {detailsModal.meetingPlatform.replace(
                          /-/g,
                          ' '
                        )}
                      </DetailBox>
                    )}
                  </div>

                  {/* ==================================================
                      ON-SITE LOCATION
                      ================================================== */}

                  {detailsModal.interviewType ===
                    'on-site' && (
                      <div className="mt-4 rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              Interview Location
                            </p>

                            <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-[var(--text-secondary)]">
                              {detailsModal.location ||
                                'Location not provided yet.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* ==================================================
                      ONLINE MEETING
                      ================================================== */}

                  {detailsModal.interviewType !==
                    'on-site' &&
                    detailsModal.meetingLink && (
                      <div className="mt-4 rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-4">
                        <div className="flex items-start gap-3">
                          <Video className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              Online Interview
                            </p>

                            <p className="mt-1 text-sm capitalize text-[var(--text-secondary)]">
                              {detailsModal.meetingPlatform?.replace(
                                /-/g,
                                ' '
                              ) || 'Online meeting'}
                            </p>

                            <a
                              href={
                                detailsModal.meetingLink
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--bg-primary)] transition hover:opacity-90"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open Meeting
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* ==================================================
                      PHONE INTERVIEW
                      ================================================== */}

                  {detailsModal.interviewType ===
                    'phone-call' && (
                      <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4">
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" />

                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              Phone Interview
                            </p>

                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              The employer will contact you at
                              the scheduled time.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* ==================================================
                      AGENDA
                      ================================================== */}

                  {detailsModal.agenda && (
                    <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4">
                      <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                        Agenda
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
                        {detailsModal.agenda}
                      </p>
                    </div>
                  )}

                  {/* ==================================================
                      INSTRUCTIONS
                      ================================================== */}

                  {detailsModal.instructions && (
                    <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
                        <FileText className="h-4 w-4" />
                        Instructions
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
                        {detailsModal.instructions}
                      </p>
                    </div>
                  )}

                  {/* ==================================================
                      CANDIDATE RESPONSE
                      ================================================== */}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailBox
                      label="Interview Status"
                      icon={
                        <CheckCircle2 className="h-4 w-4" />
                      }
                    >
                      <span className="capitalize">
                        {detailsModal.status?.replace(
                          /_/g,
                          ' '
                        ) || 'Scheduled'}
                      </span>
                    </DetailBox>

                    <DetailBox
                      label="Your Response"
                      icon={
                        <CheckCircle2 className="h-4 w-4" />
                      }
                    >
                      <span className="capitalize">
                        {detailsModal.candidateResponse?.status?.replace(
                          /_/g,
                          ' '
                        ) || 'Pending'}
                      </span>
                    </DetailBox>
                  </div>

                  {/* Candidate response note */}
                  {detailsModal.candidateResponse?.note && (
                    <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4">
                      <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                        Your Note
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
                        {detailsModal.candidateResponse.note}
                      </p>
                    </div>
                  )}

                  {/* ==================================================
                      ATTACHMENTS
                      ================================================== */}

                  {detailsModal.attachments &&
                    detailsModal.attachments.length > 0 && (
                      <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
                          <FileText className="h-4 w-4" />
                          Attachments
                        </p>

                        <div className="mt-3 space-y-2">
                          {detailsModal.attachments.map(
                            (attachment) => (
                              <a
                                key={attachment._id}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-lg border border-[var(--border-color)] px-3 py-2 transition hover:border-[var(--accent-primary)]"
                              >
                                <span className="truncate text-sm text-[var(--text-secondary)]">
                                  {attachment.fileName}
                                </span>

                                <ExternalLink className="ml-3 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* ==================================================
                      RESULT
                      ================================================== */}

                  {detailsModal.status ===
                    'completed' &&
                    detailsModal.outcome &&
                    detailsModal.outcome !== 'pending' && (
                      <div className="mt-4 rounded-xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />

                          <div>
                            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                              Interview Result
                            </p>

                            <p className="mt-1 text-sm font-semibold capitalize text-[var(--text-primary)]">
                              {detailsModal.outcome.replace(
                                /_/g,
                                ' '
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Close */}
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setDetailsModal(null)
                      }
                    >
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
          </Modal>
        )}
      </AnimatePresence>

      {/* ============================================================
          DECLINE MODAL
          ============================================================ */}

      <AnimatePresence>
        {declineModal && (
          <Modal
            onClose={() => {
              setDeclineModal(null);
              setNote('');
            }}
          >
            <h3 className="font-semibold text-[var(--text-primary)]">
              Decline Interview
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Let the employer know why (optional).
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              placeholder="Reason for declining..."
            />

            <div className="mt-4 flex gap-3">
              <Button
                variant="danger"
                onClick={handleDecline}
              >
                Confirm Decline
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setDeclineModal(null);
                  setNote('');
                }}
              >
                Cancel
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ============================================================
          RESCHEDULE MODAL
          ============================================================ */}

      <AnimatePresence>
        {rescheduleModal && (
          <Modal
            onClose={() => {
              setRescheduleModal(null);
              setNote('');
            }}
          >
            <h3 className="font-semibold text-[var(--text-primary)]">
              Request Reschedule
            </h3>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Tell the employer why you need a new time.
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              placeholder="e.g. I have a scheduling conflict at that time..."
            />

            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleRequestReschedule}
              >
                Send Request
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setRescheduleModal(null);
                  setNote('');
                }}
              >
                Cancel
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   DETAIL BOX
   ================================================================ */

function DetailBox({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-alt)] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
        {icon}
        {label}
      </p>

      <div className="mt-2 text-sm font-semibold capitalize text-[var(--text-primary)]">
        {children}
      </div>
    </div>
  );
}

/* ================================================================
   MODAL
   ================================================================ */

function Modal({
  children,
  onClose,
  maxWidth = 'max-w-md',
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: 10,
        }}
        onClick={(e) => e.stopPropagation()}
        className={`glass-card my-8 w-full ${maxWidth} rounded-2xl p-6`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}