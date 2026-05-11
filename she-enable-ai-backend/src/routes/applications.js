const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getApplications, getApplicationById, updateStatus, withdrawApplication, getPipeline, bulkUpdateStatus, getStats, updateNotes } = require('../controllers/applicationController');

router.get('/stats', protect, authorizeRoles('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), getStats);
router.get('/pipeline/:jobId', protect, authorizeRoles('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), getPipeline);
router.put('/bulk-status', protect, authorizeRoles('EMPLOYER'), bulkUpdateStatus);
router.get('/', protect, getApplications);
router.get('/:id', protect, getApplicationById);
router.put('/:id/status', protect, authorizeRoles('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), updateStatus);
router.put('/:id/notes', protect, authorizeRoles('EMPLOYER'), updateNotes);
router.post('/:id/withdraw', protect, authorizeRoles('CANDIDATE'), withdrawApplication);

module.exports = router;
