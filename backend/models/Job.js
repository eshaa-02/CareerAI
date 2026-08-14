const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    requirements: [{ type: String, trim: true }],
    responsibilities: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true, required: true }],
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      isNegotiable: { type: Boolean, default: false },
    },
    location: { type: String, required: true, trim: true },
    isRemote: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
      required: true,
    },
    experience: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      required: true,
    },
    category: { type: String, trim: true, default: 'General' },
    vacancies: { type: Number, default: 1, min: 1 },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
    },
    views: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

JobSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobSchema.index({ location: 1 });
JobSchema.index({ type: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ employerId: 1 });
JobSchema.index({ companyId: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ 'salary.min': 1, 'salary.max': 1 });

module.exports = mongoose.model('Job', JobSchema);
