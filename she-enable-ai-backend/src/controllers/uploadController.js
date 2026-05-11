const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const user = await User.findById(req.user._id);
    if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
    user.avatarUrl = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save();
    res.json({ success: true, avatarUrl: req.file.path });
  } catch (err) { next(err); }
};

const uploadCV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const profile = await CandidateProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    if (profile.cvPublicId) await cloudinary.uploader.destroy(profile.cvPublicId, { resource_type: 'raw' }).catch(() => {});
    profile.cvUrl = req.file.path;
    profile.cvPublicId = req.file.filename;
    await profile.save();
    res.json({ success: true, cvUrl: req.file.path });
  } catch (err) { next(err); }
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const profile = await EmployerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Employer profile not found.' });
    if (profile.logoPublicId) await cloudinary.uploader.destroy(profile.logoPublicId).catch(() => {});
    profile.logoUrl = req.file.path;
    profile.logoPublicId = req.file.filename;
    await profile.save();
    res.json({ success: true, logoUrl: req.file.path });
  } catch (err) { next(err); }
};

module.exports = { uploadAvatar, uploadCV, uploadLogo };
