const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000, trim: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  isDeletedBySender: { type: Boolean, default: false },
  type: { type: String, enum: ['TEXT'], default: 'TEXT' },
}, { timestamps: true });

messageSchema.index({ threadId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
