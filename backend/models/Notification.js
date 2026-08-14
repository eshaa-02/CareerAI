const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'application_received',
        'application_shortlisted',
        'application_rejected',
        'application_accepted',
        'new_user_registered',
        'new_job_posted',
        'new_message',
        'company_verified',
        'interview_scheduled',
        'interview_rescheduled',
        'interview_cancelled',
        'interview_reminder',
        'interview_result',
        'interview_instructions_updated',
        'interview_accepted',
        'interview_declined',
        'interview_reschedule_requested',
        'interview_candidate_joined',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
