const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 120,
    },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    coverImage: { type: String, default: '' },
    industry: { type: String, trim: true, default: '' },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '1-10',
    },
    foundedYear: { type: Number },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    website: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },
    verified: { type: Boolean, default: false },
    verificationDocuments: [{ type: String }],
  },
  { timestamps: true }
);

CompanySchema.index({ name: 'text', industry: 'text', description: 'text' });
CompanySchema.index({ verified: 1 });

module.exports = mongoose.model('Company', CompanySchema);
