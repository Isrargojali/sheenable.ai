const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const MessageSchema = new mongoose.Schema({
  threadId: { type: ObjectId, ref: 'MessageThread', required: true },
  senderId: { type: ObjectId, ref: 'User', required: true },
  content:  { type: String, required: true },
  isRead:   { type: Boolean, default: false },
  readAt:   { type: Date },
}, { timestamps: true });

MessageSchema.index({ threadId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
