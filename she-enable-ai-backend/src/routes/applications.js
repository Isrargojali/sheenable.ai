const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { applyForJob, getMyApplications, getJobApplications, getPipeline, updateStatus, bulkUpdateStatus, acceptInterview, acceptJobOffer } = require('../controllers/applicationController');

router.use(protect);

router.post('/:jobId/apply', authorize('CANDIDATE'), applyForJob);
router.get('/me', authorize('CANDIDATE'), getMyApplications);
router.post('/:id/accept-interview', authorize('CANDIDATE'), acceptInterview);
router.post('/:id/accept-offer', authorize('CANDIDATE'), acceptJobOffer);

router.get('/job/:jobId', authorize('EMPLOYER'), getJobApplications);
router.get('/job/:jobId/pipeline', authorize('EMPLOYER'), getPipeline);

router.patch('/bulk-status', authorize('EMPLOYER'), bulkUpdateStatus); // Must be before /:id
router.patch('/:id/status', authorize('EMPLOYER'), updateStatus);

module.exports = router;
