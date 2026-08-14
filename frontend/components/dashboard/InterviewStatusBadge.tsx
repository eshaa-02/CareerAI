import { InterviewStatus } from '@/types';
import { cn } from '@/utils/helpers';

const STATUS_STYLES: Record<InterviewStatus, string> = {
  scheduled: 'bg-blue-500/15 text-blue-400',
  invitation_sent: 'bg-blue-500/15 text-blue-400',
  accepted: 'bg-emerald-500/15 text-emerald-500',
  declined: 'bg-red-500/15 text-red-400',
  reschedule_requested: 'bg-amber-500/15 text-amber-500',
  rescheduled: 'bg-amber-500/15 text-amber-500',
  reminder_sent: 'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-purple-500/15 text-purple-400',
  completed: 'bg-[var(--bg-card-alt)] text-[var(--text-secondary)]',
  cancelled: 'bg-red-500/15 text-red-400',
};

const STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  invitation_sent: 'Invitation Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  reschedule_requested: 'Reschedule Requested',
  rescheduled: 'Rescheduled',
  reminder_sent: 'Reminder Sent',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}
