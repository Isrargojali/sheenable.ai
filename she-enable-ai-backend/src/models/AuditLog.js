const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const AuditLogSchema = new mongoose.Schema({
  userId:       { type: ObjectId, ref: 'User' },
  action:       { type: String, required: true, index: true },
  resourceType: { type: String, required: true },
  resourceId:   { type: ObjectId },
  changes:      { type: mongoose.Schema.Types.Mixed },
  ipAddress:    { type: String },
  userAgent:    { type: String },
  status:       { type: String, enum: ['SUCCESS','FAILURE'], default: 'SUCCESS' },
}, { timestamps: true });

AuditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
