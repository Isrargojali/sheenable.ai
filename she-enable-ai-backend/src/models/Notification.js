const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['JOB_MATCH', 'APPLICATION_STATUS', 'MESSAGE', 'INTERVIEW', 'SYSTEM'], required: true },
  title: { type: String, required: true },
  body: { type: String },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
