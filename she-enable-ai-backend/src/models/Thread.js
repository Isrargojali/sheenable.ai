// Thread.js
const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  lastMessage:     { type: String },
  lastMessageAt:   { type: Date },
  unreadCandidate: { type: Number, default: 0 },
  unreadEmployer:  { type: Number, default: 0 },
}, { timestamps: true });

threadSchema.index({ candidateId: 1, employerId: 1 }, { unique: true });
module.exports = mongoose.model('Thread', threadSchema);