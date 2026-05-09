const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:       { type: String, required: true },  // e.g. 'USER_LOGIN', 'JOB_CREATED'
  resourceType: { type: String },                  // e.g. 'Job', 'Application'
  resourceId:   { type: mongoose.Schema.Types.ObjectId },
  changes:      { type: mongoose.Schema.Types.Mixed }, // What changed
  ipAddress:    { type: String },
  userAgent:    { type: String },
  status:       { type: String, enum: ['SUCCESS','FAILURE'], default: 'SUCCESS' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);