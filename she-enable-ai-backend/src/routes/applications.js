const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const {
  getApplications, getApplicationById, updateStatus, withdrawApplication,
  getPipeline, bulkUpdateStatus, getStats, updateNotes,
} = require('../controllers/applicationController');

// Specific routes must come before parameterized ones
router.get('/stats',            protect, authorizeRoles('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), getStats);
router.get('/pipeline/:jobId',  protect, authorizeRoles('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), getPipeline);
router.put('/bulk-status',      protect, authorizeRoles('EMPLOYER'), bulkUpdateStatus);

// Apply to job — POST /api/applications/:jobId/apply (matches api.ts)
router.post('/:jobId/apply',    protect, authorizeRoles('CANDIDATE'), async (req, res, next) => {
  // Delegate to jobController.applyToJob but via this route path
  const { applyToJob } = require('../controllers/jobController');
  // Remap params so jobController sees req.params.id
  req.params.id = req.params.jobId;
  return applyToJob(req, res, next);
});

router.get('/',                 protect, getApplications);
router.get('/:id',              protect, getApplicationById);
router.put('/:id/status',       protect, authorizeRoles('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'), updateStatus);
router.put('/:id/notes',        protect, authorizeRoles('EMPLOYER'), updateNotes);
router.post('/:id/withdraw',    protect, authorizeRoles('CANDIDATE'), withdrawApplication);

module.exports = router;
