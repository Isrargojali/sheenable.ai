const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const {
  getMe,
  updateProfile,
  getCandidateStats,
  getUpcomingInterviews,
  getCandidateProfile,
  updateCandidateProfile,
  getEmployerProfile,
  updateEmployerProfile,
  getCv,
  saveCv,
  uploadAvatar,
} = require('../controllers/profileController');

// ─── Common ───────────────────────────────────────────────────────────────────
router.get('/me',  protect, getMe);
router.put('/me',  protect, updateProfile);

// ─── Avatar upload ─────────────────────────────────────────────────────────────
// Uses Cloudinary when keys are configured, otherwise returns an error gracefully
router.post('/upload-avatar', protect, (req, res, next) => {
  // Lazy-load upload middleware so missing Cloudinary keys don't crash server boot
  try {
    const { uploadAvatar: uploadMiddleware } = require('../middleware/upload');
    uploadMiddleware.single('avatar')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  } catch {
    return res.status(503).json({ success: false, message: 'Upload service not configured.' });
  }
}, uploadAvatar);

// ─── Candidate ────────────────────────────────────────────────────────────────
router.get('/candidate-stats',     protect, authorizeRoles('CANDIDATE'), getCandidateStats);
router.get('/upcoming-interviews', protect, authorizeRoles('CANDIDATE'), getUpcomingInterviews);
router.get('/candidate',           protect, authorizeRoles('CANDIDATE'), getCandidateProfile);
router.put('/candidate',           protect, authorizeRoles('CANDIDATE'), updateCandidateProfile);
router.get('/cv',                  protect, authorizeRoles('CANDIDATE'), getCv);
router.put('/cv',                  protect, authorizeRoles('CANDIDATE'), saveCv);

// ─── Availability toggle ──────────────────────────────────────────────────────
router.put('/availability', protect, authorizeRoles('CANDIDATE'), async (req, res, next) => {
  try {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const UserModel = db.User || require('../models/User');
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isAvailable must be a boolean.' });
    }
    await UserModel.findByIdAndUpdate(req.user._id, { isAvailable });
    res.json({ success: true, data: { isAvailable } });
  } catch (err) { next(err); }
});

// ─── Employer ─────────────────────────────────────────────────────────────────
router.get('/employer', protect, authorizeRoles('EMPLOYER'), getEmployerProfile);
router.put('/employer', protect, authorizeRoles('EMPLOYER'), updateEmployerProfile);

module.exports = router;
