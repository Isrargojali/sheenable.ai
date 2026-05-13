const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { applyForJob, getMyApplications, getJobApplications, getPipeline, updateStatus, bulkUpdateStatus } = require('../controllers/applicationController');

router.use(protect);

router.post('/:jobId/apply', authorize('CANDIDATE'), applyForJob);
router.get('/me', authorize('CANDIDATE'), getMyApplications);

router.get('/job/:jobId', authorize('EMPLOYER'), getJobApplications);
router.get('/job/:jobId/pipeline', authorize('EMPLOYER'), getPipeline);

router.patch('/bulk-status', authorize('EMPLOYER'), bulkUpdateStatus); // Must be before /:id
router.patch('/:id/status', authorize('EMPLOYER'), updateStatus);

module.exports = router;
