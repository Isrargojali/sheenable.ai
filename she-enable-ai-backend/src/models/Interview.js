const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const InterviewSchema = new mongoose.Schema({
  applicationId: { type: ObjectId, ref: 'Application', required: true, unique: true },
  interviewerId: { type: ObjectId, ref: 'User', required: true },
  candidateId:   { type: ObjectId, ref: 'User', required: true },
  scheduledAt:   { type: Date, required: true },
  durationMins:  { type: Number, default: 60 },
  type:          { type: String, enum: ['PHONE','VIDEO','IN_PERSON'], default: 'VIDEO' },
  meetingLink:   { type: String },
  status:        { type: String, enum: ['SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'], default: 'SCHEDULED' },
  notes:         { type: String },
  rating:        { type: Number, min: 1, max: 5 },
  cancelledBy:   { type: ObjectId, ref: 'User' },
  cancelReason:  { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Interview', InterviewSchema);
