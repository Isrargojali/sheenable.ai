const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getMe, updateProfile, getCandidateStats, getUpcomingInterviews, updateCandidateProfile, updateEmployerProfile } = require('../controllers/profileController');

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.get('/candidate-stats',        protect, authorizeRoles('CANDIDATE'), getCandidateStats);
router.get('/upcoming-interviews',    protect, authorizeRoles('CANDIDATE'), getUpcomingInterviews);
router.put('/candidate', protect, authorizeRoles('CANDIDATE'), updateCandidateProfile);
router.put('/employer',  protect, authorizeRoles('EMPLOYER'),  updateEmployerProfile);
router.put('/availability', protect, authorizeRoles('CANDIDATE'), async (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const UserModel = db.User || require('../models/User');
    await UserModel.findByIdAndUpdate(req.user._id, { isAvailable: req.body.isAvailable });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
