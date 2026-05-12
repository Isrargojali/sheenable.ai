const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');

// Upload avatar — POST /api/upload/avatar
router.post('/avatar', protect, (req, res, next) => {
  try {
    const { uploadAvatar } = require('../middleware/upload');
    uploadAvatar.single('avatar')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  } catch {
    return res.status(503).json({ success: false, message: 'Upload service not configured. Set CLOUDINARY_* env vars.' });
  }
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const { getDatabase } = require('../config/database');
  const db = getDatabase();
  const UserModel = db.User || require('../models/User');
  await UserModel.findByIdAndUpdate(req.user._id, {
    avatarUrl:      req.file.path,
    avatarPublicId: req.file.filename,
  });
  res.json({ success: true, data: { avatarUrl: req.file.path }, message: 'Avatar updated.' });
});

// Upload resume — POST /api/upload/cv
router.post('/cv', protect, authorizeRoles('CANDIDATE'), (req, res, next) => {
  try {
    const { uploadResume } = require('../middleware/upload');
    uploadResume.single('resume')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  } catch {
    return res.status(503).json({ success: false, message: 'Upload service not configured. Set CLOUDINARY_* env vars.' });
  }
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  const CandidateProfile = require('../models/CandidateProfile');
  await CandidateProfile.findOneAndUpdate(
    { userId: req.user._id },
    { cvUrl: req.file.path },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: { cvUrl: req.file.path }, message: 'Resume uploaded.' });
});

module.exports = router;
