const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const {
  getUsers, getUserById,
  updateUserStatus, updateUserRole, deleteUser,
  getAuditLogs, getPlatformStats, getSecurityInfo,
  getAnalytics, getJobsAdmin, updateJobStatus,
} = require('../controllers/adminController');

const ADMIN_OR_SUPER = authorizeRoles('ADMIN', 'SUPER_ADMIN');
const SUPER_ONLY     = authorizeRoles('SUPER_ADMIN');

// ── Platform overview ─────────────────────────────────────────────────────────
router.get('/stats',      protect, ADMIN_OR_SUPER, getPlatformStats);
router.get('/security',   protect, ADMIN_OR_SUPER, getSecurityInfo);
router.get('/audit-logs', protect, ADMIN_OR_SUPER, getAuditLogs);
router.get('/analytics',  protect, ADMIN_OR_SUPER, getAnalytics);

// ── User management ───────────────────────────────────────────────────────────
router.get('/users',                   protect, ADMIN_OR_SUPER, getUsers);
router.get('/users/:userId',           protect, ADMIN_OR_SUPER, getUserById);
router.patch('/users/:userId/status',  protect, ADMIN_OR_SUPER, updateUserStatus);
router.patch('/users/:userId/role',    protect, SUPER_ONLY,     updateUserRole);
router.delete('/users/:userId',        protect, SUPER_ONLY,     deleteUser);

// ── Job management ────────────────────────────────────────────────────────────
router.get('/jobs',                    protect, ADMIN_OR_SUPER, getJobsAdmin);
router.put('/jobs/:jobId/status',      protect, ADMIN_OR_SUPER, updateJobStatus);

module.exports = router;
