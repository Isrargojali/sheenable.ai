const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { getJobs, getJobById, postJob, updateJob, deleteJob, getMyListings, saveJob, getSavedJobs, getRecommendedJobs } = require('../controllers/jobController');

router.get('/', optionalAuth, getJobs);
router.get('/recommended', protect, authorize('CANDIDATE'), getRecommendedJobs);
router.get('/saved', protect, authorize('CANDIDATE'), getSavedJobs);
router.get('/me', protect, authorize('EMPLOYER'), getMyListings);

router.get('/:id', optionalAuth, getJobById);
router.post('/', protect, authorize('EMPLOYER'), postJob);
router.put('/:id', protect, authorize('EMPLOYER'), updateJob);
router.delete('/:id', protect, authorize('EMPLOYER'), deleteJob);

router.post('/:id/save', protect, authorize('CANDIDATE'), saveJob);

module.exports = router;