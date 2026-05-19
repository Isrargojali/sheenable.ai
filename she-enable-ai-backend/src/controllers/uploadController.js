const { success, error } = require('../utils/apiResponse');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');

const uploadAvatarFile = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No image file uploaded', 400);

    // Validate MIME type server-side (multer-storage-cloudinary may bypass fileFilter)
    const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_MIME.includes(req.file.mimetype)) {
      return error(res, 'Only JPEG, PNG, WebP, and GIF images are allowed', 415);
    }

    const avatarUrl = req.file.path; // Cloudinary returns the secure URL in req.file.path
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
