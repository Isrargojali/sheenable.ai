const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['APPLIED','SCREENING','INTERVIEW','OFFERED','REJECTED'],
    default: 'APPLIED'
  },
  coverLetter:    { type: String, maxlength: 2000 },
  resumeUrl:      { type: String },
  aiMatchScore:   { type: Number, min: 0, max: 100 },
  rejectionReason:{ type: String },
  rejectedAt:     { type: Date },
  statusHistory: [{
    status:    String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
}, { timestamps: true });

// Prevent a candidate from applying to the same job twice
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);