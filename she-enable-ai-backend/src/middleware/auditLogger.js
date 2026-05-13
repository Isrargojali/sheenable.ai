const { getDatabase } = require('../config/database');

const logAudit = async (req, action, resourceType, resourceId = null, changes = null, status = 'SUCCESS') => {
  try {
    const { AuditLog } = getDatabase();
    if (!AuditLog) return;
    
    await AuditLog.create({
      userId: req.user ? req.user._id : null,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      status,
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

module.exports = { logAudit };
