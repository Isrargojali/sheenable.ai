// Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  content:  { type: String, required: true, maxlength: 2000 },
  isRead:   { type: Boolean, default: false },
  readAt:   { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);