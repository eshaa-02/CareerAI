const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume: {
      url: { type: String, required: true },
      fileName: { type: String, default: '' },
    },
    coverLetter: { type: String, trim: true, maxlength: 3000, default: '' },
    matchScore: { type: Number, default: 0, min: 0, max: 100 },
    matchDetails: {
      matchedSkills: [{ type: String }],
      missingSkills: [{ type: String }],
      recommendation: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'accepted', 'withdrawn'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate applications for same job by same candidate
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
ApplicationSchema.index({ candidateId: 1 });
ApplicationSchema.index({ employerId: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
