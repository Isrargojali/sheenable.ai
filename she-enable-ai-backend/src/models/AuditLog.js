const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resourceType: { type: String },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
}, { timestamps: true });

auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
