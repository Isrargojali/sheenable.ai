const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt:   { type: Date, required: true },
  durationMins:  { type: Number, default: 60 },
  type:   { type: String, enum: ['PHONE','VIDEO','IN_PERSON'], default: 'VIDEO' },
  status: { type: String, enum: ['SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'], default: 'SCHEDULED' },
  meetingLink: { type: String },
  notes:  { type: String },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);