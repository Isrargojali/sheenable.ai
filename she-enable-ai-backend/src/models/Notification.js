const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const NotificationSchema = new mongoose.Schema({
  userId:      { type: ObjectId, ref: 'User', required: true, index: true },
  type:        { type: String, enum: ['JOB_MATCH','APPLICATION_STATUS','MESSAGE','INTERVIEW','SYSTEM'] },
  title:       { type: String, required: true },
  body:        { type: String },
  relatedId:   { type: ObjectId },
  relatedType: { type: String },
  isRead:      { type: Boolean, default: false, index: true },
  readAt:      { type: Date },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
