const AuditLog = require('../models/AuditLog');

const logAction = async ({ userId, action, resourceType, resourceId, changes, req, status = 'SUCCESS' }) => {
  try {
    await AuditLog.create({ userId, action, resourceType, resourceId, changes, ipAddress: req?.ip, userAgent: req?.headers?.['user-agent'], status });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { logAction };
