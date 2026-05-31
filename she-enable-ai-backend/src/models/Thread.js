const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: null },
  lastSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  unreadCandidate: { type: Number, default: 0 },
  unreadEmployer: { type: Number, default: 0 },
  deletedByCandidate: { type: Boolean, default: false },
  deletedByEmployer: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

threadSchema.index({ candidateId: 1, employerId: 1 }, { unique: true });

module.exports = mongoose.model('Thread', threadSchema);

