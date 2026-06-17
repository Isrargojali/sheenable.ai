const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { getProfile, updateProfile, getCandidateProfile, getEmployerProfile, getCv, saveCv, getCandidateStats, getEmployerStats } = require('../controllers/profileController');

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);

router.get('/candidate-stats', authorize('CANDIDATE'), getCandidateStats);
router.get('/employer-stats', authorize('EMPLOYER'), getEmployerStats);

router.get('/candidate/:id', getCandidateProfile);
router.get('/employer/:id', getEmployerProfile);

router.get('/cv', authorize('CANDIDATE'), getCv);
router.post('/cv', authorize('CANDIDATE'), saveCv);

module.exports = router;
