const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const MessageThreadSchema = new mongoose.Schema({
  candidateId: { type: ObjectId, ref: 'User', required: true },
  employerId: { type: ObjectId, ref: 'User', required: true },
  jobId: { type: ObjectId, ref: 'Job' },
  lastMessage: {
    content: String,
    sentAt: Date,
    senderId: { type: ObjectId, ref: 'User' }
  },
  unreadCandidate: { type: Number, default: 0 },
  unreadEmployer: { type: Number, default: 0 },
}, { timestamps: true });

MessageThreadSchema.index({ candidateId: 1, employerId: 1 }, { unique: true });

module.exports = mongoose.model('MessageThread', MessageThreadSchema);
