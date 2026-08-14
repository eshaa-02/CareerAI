const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    currentlyStudying: { type: Boolean, default: false },
    grade: { type: String, trim: true },
  },
  { _id: true }
);

const ExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { _id: true }
);

const CertificateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    issuingOrganization: { type: String, trim: true },
    issueDate: { type: Date },
    credentialUrl: { type: String, trim: true },
  },
  { _id: true }
);

const CandidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    headline: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '', maxlength: 1000 },
    resume: {
      url: { type: String, default: '' },
      fileName: { type: String, default: '' },
      uploadedAt: { type: Date },
    },
    education: [EducationSchema],
    experience: [ExperienceSchema],
    certificates: [CertificateSchema],
    skills: [{ type: String, trim: true }],
    desiredJobTitle: { type: String, trim: true, default: '' },
    desiredSalary: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ['immediate', '2weeks', '1month', 'not-looking'],
      default: 'immediate',
    },
    links: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

CandidateProfileSchema.index({ userId: 1 });
CandidateProfileSchema.index({ skills: 1 });

// Dynamically calculate profile completion percentage.
// Each weighted section only counts if meaningfully filled.
CandidateProfileSchema.methods.calculateCompletion = function (user) {
  const sections = [
    { weight: 10, complete: !!(user && user.name) },
    { weight: 10, complete: !!(user && user.email) },
    { weight: 8, complete: !!(user && user.phone) },
    { weight: 7, complete: !!(user && user.location) },
    { weight: 8, complete: !!(user && user.avatar && user.avatar.url) },
    { weight: 10, complete: !!this.headline },
    { weight: 7, complete: !!this.bio && this.bio.length >= 20 },
    { weight: 15, complete: !!(this.resume && this.resume.url) },
    { weight: 10, complete: this.skills && this.skills.length >= 3 },
    { weight: 8, complete: this.education && this.education.length > 0 },
    { weight: 7, complete: this.experience && this.experience.length > 0 },
  ];

  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);
  const earnedWeight = sections.reduce(
    (sum, s) => sum + (s.complete ? s.weight : 0),
    0
  );

  const percentage = Math.round((earnedWeight / totalWeight) * 100);
  this.completionPercentage = percentage;
  return percentage;
};

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
