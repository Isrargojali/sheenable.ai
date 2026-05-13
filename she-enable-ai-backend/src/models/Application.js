const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const ApplicationSchema = new mongoose.Schema({
  jobId: { type: ObjectId, ref: 'Job', required: true, index: true },
  candidateId: { type: ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'REJECTED'], default: 'APPLIED', index: true },
  coverLetter: String,
  resumeUrl: String,
  aiMatchScore: { type: Number, min: 0, max: 100, default: 0 },
  employerNotes: String,
  rejectionReason: String,
  appliedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// Prevent duplicate applications
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ candidateId: 1, status: 1 });

module.exports = mongoose.model('Application', ApplicationSchema);
