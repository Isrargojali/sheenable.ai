const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { getProfile, updateProfile, getCandidateProfile, getEmployerProfile, getCv, saveCv, uploadAvatar, uploadCvFile, getCandidateStats, getEmployerStats } = require('../controllers/profileController');
const { uploadAvatar: uploadAvatarMiddleware, uploadCv: uploadCvMiddleware } = require('../middleware/upload');

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);

router.get('/candidate-stats', authorize('CANDIDATE'), getCandidateStats);
router.get('/employer-stats', authorize('EMPLOYER'), getEmployerStats);

router.get('/candidate/:id', getCandidateProfile);
router.get('/employer/:id', getEmployerProfile);

router.get('/cv', authorize('CANDIDATE'), getCv);
router.post('/cv', authorize('CANDIDATE'), saveCv);

// Handled in upload.js normally, but we can have it here for logical grouping as well
router.post('/avatar', uploadAvatarMiddleware.single('avatar'), uploadAvatar);
router.post('/cv/file', authorize('CANDIDATE'), uploadCvMiddleware.single('cv'), uploadCvFile);

module.exports = router;



