const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  getStats, getUsers, getUserById, updateUserRole, updateUserStatus, deleteUser,
  getAuditLogs, getSecurityInfo, getAnalytics, getJobsAdmin, updateJobStatusAdmin, getThreatData,
  getSystemHealth, createAdminUser
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/stats', getStats);
router.get('/security-threats', getThreatData);
router.get('/system-health', getSystemHealth);
router.get('/users', getUsers);
router.post('/users', authorize('SUPER_ADMIN'), createAdminUser);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', authorize('SUPER_ADMIN'), updateUserRole); // Bug 6 fix: Only SUPER_ADMIN can change roles
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', authorize('SUPER_ADMIN'), deleteUser);

router.get('/audit-logs', getAuditLogs);
router.get('/security', getSecurityInfo);
router.get('/analytics', getAnalytics);

router.get('/jobs', getJobsAdmin);
router.patch('/jobs/:id/status', updateJobStatusAdmin);

module.exports = router;

