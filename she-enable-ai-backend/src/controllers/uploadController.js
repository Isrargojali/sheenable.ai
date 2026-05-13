const { success, error } = require('../utils/apiResponse');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');

const uploadAvatarFile = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No image file uploaded', 400);
    const avatarUrl = req.file.path;
    await User.findByIdAndUpdate(req.user.id, { avatarUrl });
    return success(res, { avatarUrl });
  } catch (err) { next(err); }
};

const uploadCvDocument = async (req, res, next) => {
  try {
    if (req.user.role !== 'CANDIDATE') return error(res, 'Only candidates can upload CVs', 403);
    if (!req.file) return error(res, 'No file uploaded', 400);
    
    const cvFileUrl = req.file.path;
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user.id },
      { cvFileUrl },
      { new: true, upsert: true }
    );
    return success(res, { cvFileUrl: profile.cvFileUrl });
  } catch (err) { next(err); }
};

module.exports = {
  uploadAvatarFile, uploadCvDocument
};
