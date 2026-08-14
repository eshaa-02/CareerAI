const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    strengths: { type: String, trim: true, default: '' },
    weaknesses: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    technicalRating: { type: Number, min: 0, max: 5, default: 0 },
    communicationRating: { type: Number, min: 0, max: 5, default: 0 },
    culturalFitRating: { type: Number, min: 0, max: 5, default: 0 },
    overallRating: { type: Number, min: 0, max: 5, default: 0 },
    recommendation: {
      type: String,
      enum: ['strong_yes', 'yes', 'neutral', 'no', 'strong_no', ''],
      default: '',
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ActivityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    interviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    interviewRound: {
      type: String,
      enum: ['round-1', 'round-2', 'round-3', 'technical', 'hr', 'final'],
      default: 'round-1',
    },
    interviewType: {
      type: String,
      enum: ['online', 'on-site', 'phone-call', 'technical-assessment', 'hr-interview', 'final-interview'],
      required: true,
    },
    meetingPlatform: {
      type: String,
      enum: ['google-meet', 'zoom', 'microsoft-teams', 'phone', 'in-person', 'other'],
      default: 'other',
    },
    meetingLink: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },

    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // "HH:mm" in the given timezone
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    timezone: { type: String, default: 'UTC' },

    instructions: { type: String, trim: true, default: '' },
    agenda: { type: String, trim: true, default: '' },
    attachments: [AttachmentSchema],

    attachments?: {
      _id?: string;
      fileName: string;
      url: string;
      uploadedBy?: string | any;
      uploadedAt?: string;
    }[];

    status: {
      type: String,
      enum: [
        'scheduled',
        'invitation_sent',
        'accepted',
        'declined',
        'reschedule_requested',
        'rescheduled',
        'reminder_sent',
        'in_progress',
        'completed',
        'cancelled',
      ],
      default: 'scheduled',
    },

    // Outcome, set once the interview is completed and reviewed
    outcome: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'selected', 'rejected', 'on_hold', 'next_round', ''],
      default: 'pending',
    },

    candidateResponse: {
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'reschedule_requested'],
        default: 'pending',
      },
      note: { type: String, trim: true, default: '' },
      respondedAt: { type: Date },
    },

    rescheduleRequest: {
      requestedDate: { type: Date },
      requestedNote: { type: String, trim: true, default: '' },
      requestedAt: { type: Date },
    },

    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String, trim: true, default: '' },
      cancelledAt: { type: Date },
    },

    employerNotes: { type: String, trim: true, default: '' }, // private, employer/admin only
    feedback: [FeedbackSchema],

    remindersSent: {
      hour24: { type: Boolean, default: false },
      hour1: { type: Boolean, default: false },
    },

    recordingUrl: { type: String, trim: true, default: '' },
    activityLog: [ActivityLogSchema],
  },
  { timestamps: true }
);

InterviewSchema.index({ candidateId: 1, date: -1 });
InterviewSchema.index({ employerId: 1, date: -1 });
InterviewSchema.index({ companyId: 1 });
InterviewSchema.index({ jobId: 1 });
InterviewSchema.index({ status: 1 });
InterviewSchema.index({ date: 1 });

InterviewSchema.methods.logActivity = function (action, performedBy, note = '') {
  this.activityLog.push({ action, performedBy, note, timestamp: new Date() });
};

// Average overall rating across all interviewer feedback entries
InterviewSchema.methods.getAverageRating = function () {
  if (!this.feedback || this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + (f.overallRating || 0), 0);
  return Math.round((sum / this.feedback.length) * 10) / 10;
};

module.exports = mongoose.model('Interview', InterviewSchema);
