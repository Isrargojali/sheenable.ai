const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const JobSchema = new mongoose.Schema({
  employerId:   { type: ObjectId, ref: 'User', required: true, index: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  category:     { type: String, required: true, index: true },
  jobType:      { type: String, enum: ['FULLTIME','PARTTIME','CONTRACT','INTERNSHIP'], required: true, index: true },
  jobMode:      { type: String, enum: ['REMOTE','HYBRID','ONSITE'], required: true, index: true },
  location:     { type: String },
  salary: {
    min:      Number,
    max:      Number,
    currency: { type: String, default: 'USD' },
    isPublic: { type: Boolean, default: true }
  },
  skillsRequired: [{ type: String, trim: true }],
  perks:          [String],
  experienceRequired: Number,
  status:       { type: String, enum: ['DRAFT','PUBLISHED','CLOSED','ARCHIVED'], default: 'DRAFT', index: true },
  isFeatured:   { type: Boolean, default: false, index: true },
  applicationCount: { type: Number, default: 0 },
  viewCount:    { type: Number, default: 0 },
  deadline:     { type: Date },
  publishedAt:  { type: Date },
}, { timestamps: true });

// Full-text search
JobSchema.index({ title: 'text', description: 'text', skillsRequired: 'text' });
// Compound for filtered list queries
JobSchema.index({ status: 1, category: 1, jobType: 1, jobMode: 1, createdAt: -1 });
JobSchema.index({ employerId: 1, status: 1 });

module.exports = mongoose.model('Job', JobSchema);
