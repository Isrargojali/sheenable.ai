const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const {
  getStats, getUsers, getUserById, updateUserRole, updateUserStatus, deleteUser,
  getAuditLogs, getSecurityInfo, getAnalytics, getTimeseries,
  getUserAnalytics, getSecurityAnalytics, getAuditAnalytics, getAdminActivityAnalytics,
  getJobsAdmin, updateJobStatusAdmin, getThreatData,
  getSystemHealth, createAdminUser
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/stats', getStats);
router.get('/stats/timeseries', getTimeseries);
router.get('/analytics', getAnalytics);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/security', getSecurityAnalytics);
router.get('/analytics/audit', getAuditAnalytics);
router.get('/analytics/admins', getAdminActivityAnalytics);

router.get('/security-threats', getThreatData);
router.get('/system-health', getSystemHealth);
router.get('/users', getUsers);
router.post('/users', authorize('SUPER_ADMIN'), createAdminUser);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', authorize('SUPER_ADMIN'), updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', authorize('SUPER_ADMIN'), deleteUser);

router.get('/audit-logs', getAuditLogs);
router.get('/security', getSecurityInfo);

router.get('/jobs', getJobsAdmin);
router.patch('/jobs/:id/status', updateJobStatusAdmin);

module.exports = router;


