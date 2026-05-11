const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const {
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAuditLogs,
  getPlatformStats,
  getSecurityInfo,
} = require('../controllers/adminController');

const ADMIN_OR_SUPER = authorizeRoles('ADMIN', 'SUPER_ADMIN');
const SUPER_ONLY     = authorizeRoles('SUPER_ADMIN');

// ── Platform overview ─────────────────────────────────────────────────────────
router.get('/stats',      protect, ADMIN_OR_SUPER, getPlatformStats);
router.get('/security',   protect, ADMIN_OR_SUPER, getSecurityInfo);   // FIX 11 — was missing
router.get('/audit-logs', protect, ADMIN_OR_SUPER, getAuditLogs);

// ── User management ───────────────────────────────────────────────────────────
router.get('/users',                   protect, ADMIN_OR_SUPER, getUsers);
router.patch('/users/:userId/status',  protect, ADMIN_OR_SUPER, updateUserStatus);
router.patch('/users/:userId/role',    protect, SUPER_ONLY,     updateUserRole);   // SUPER_ADMIN only
router.delete('/users/:userId',        protect, SUPER_ONLY,     deleteUser);        // FIX 6 — new, SUPER_ADMIN only

module.exports = router;
