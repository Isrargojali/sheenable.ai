const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'REJECTED', 'WITHDRAWN'], default: 'APPLIED' },
  coverLetter: { type: String, maxlength: 2000, default: '' },
  resumeUrl: { type: String, default: '' },
  aiMatchScore: { type: Number, min: 0, max: 100, default: null },
  statusHistory: [{ status: { type: String, required: true }, changedAt: { type: Date, default: Date.now }, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, note: { type: String, default: '' } }],
  employerNotes: { type: String, default: '', maxlength: 1000 },
  rejectionReason: { type: String, default: '' },
  rejectedAt: { type: Date },
  offerDetails: { salary: { type: Number }, startDate: { type: Date }, message: { type: String } },
  withdrawnAt: { type: Date },
  withdrawalReason: { type: String, default: '' },
  isReadByCandidate: { type: Boolean, default: false },
}, { timestamps: true });

applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ candidateId: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
