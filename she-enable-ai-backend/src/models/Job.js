const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  jobType: { type: String, enum: ['FULLTIME', 'PARTTIME', 'CONTRACT', 'INTERNSHIP'], required: true },
  jobMode: { type: String, enum: ['REMOTE', 'HYBRID', 'ONSITE'], required: true },
  location: { type: String },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  currency: { type: String, default: 'USD' },
  skillsRequired: [String],
  perks: [String],
  experienceYears: { type: Number, default: 0 },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'], default: 'DRAFT' },
  isFeatured: { type: Boolean, default: false },
  deadline: { type: Date },
  viewCount: { type: Number, default: 0 },
  applicationCount: { type: Number, default: 0 },
  publishedAt: { type: Date },
}, { timestamps: true });

jobSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
