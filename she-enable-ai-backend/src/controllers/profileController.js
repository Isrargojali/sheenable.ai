const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');
const User = require('../models/User');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const { success, error } = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    let profile;
    if (role === 'CANDIDATE') {
      profile = await CandidateProfile.findOne({ userId: id }).populate('userId', 'firstName lastName email avatarUrl');
      if (!profile) {
        profile = await CandidateProfile.create({ userId: id });
        profile = await CandidateProfile.findById(profile._id).populate('userId', 'firstName lastName email avatarUrl');
      }
    } else if (role === 'EMPLOYER') {
      profile = await EmployerProfile.findOne({ userId: id }).populate('userId', 'firstName lastName email avatarUrl');
      if (!profile) {
        profile = await EmployerProfile.create({ userId: id, companyName: 'My Company', industry: 'Other' });
        profile = await EmployerProfile.findById(profile._id).populate('userId', 'firstName lastName email avatarUrl');
      }
    } else {
      // Admin might fetch their basic user info
      const adminUser = await User.findById(id).select('-password');
      return success(res, adminUser);
    }

    return success(res, profile);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    // Update basic user info if provided
    if (req.body.firstName || req.body.lastName) {
      await User.findByIdAndUpdate(id, {
        ...(req.body.firstName && { firstName: req.body.firstName }),
        ...(req.body.lastName && { lastName: req.body.lastName })
      });
    }

    let profile;
    if (role === 'CANDIDATE') {
      const updateData = { ...req.body };
      delete updateData.userId; // prevent overriding userId
      profile = await CandidateProfile.findOneAndUpdate({ userId: id }, updateData, { new: true, runValidators: true }).populate('userId', 'firstName lastName email avatarUrl');
    } else if (role === 'EMPLOYER') {
      const updateData = { ...req.body };
      delete updateData.userId;
      profile = await EmployerProfile.findOneAndUpdate({ userId: id }, updateData, { new: true, runValidators: true }).populate('userId', 'firstName lastName email avatarUrl');
    }

    return success(res, profile);
  } catch (err) { next(err); }
};

const getCandidateProfile = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.params.id }).populate('userId', 'firstName lastName email avatarUrl gender');
    if (!profile) return error(res, 'Profile not found', 404);

    if (req.user.role === 'EMPLOYER') {
      await CandidateProfile.findByIdAndUpdate(profile._id, { $inc: { profileViews: 1 } });
    }

    return success(res, profile);
  } catch (err) { next(err); }
};

const getEmployerProfile = async (req, res, next) => {
  try {
    const profile = await EmployerProfile.findOne({ userId: req.params.id }).populate('userId', 'firstName lastName avatarUrl');
    if (!profile) return error(res, 'Profile not found', 404);
    return success(res, profile);
  } catch (err) { next(err); }
};

const getCv = async (req, res, next) => {
  try {
    if (req.user.role !== 'CANDIDATE') return error(res, 'Only candidates have CVs', 403);
    const profile = await CandidateProfile.findOne({ userId: req.user.id }).select('cv cvFileUrl');
    if (!profile) return error(res, 'Profile not found', 404);
    return success(res, profile);
  } catch (err) { next(err); }
};

const saveCv = async (req, res, next) => {
  try {
    if (req.user.role !== 'CANDIDATE') return error(res, 'Only candidates can save CVs', 403);
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user.id },
      { cv: { ...req.body, lastUpdated: new Date() } },
      { new: true, upsert: true }
    );
    return success(res, profile.cv);
  } catch (err) { next(err); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No image file uploaded', 400);
    const avatarUrl = req.file.path; // Cloudinary returns the URL in path
    await User.findByIdAndUpdate(req.user.id, { avatarUrl });
    return success(res, { avatarUrl });
  } catch (err) { next(err); }
};

const uploadCvFile = async (req, res, next) => {
  try {
    if (req.user.role !== 'CANDIDATE') return error(res, 'Only candidates can upload CV files', 403);
    if (!req.file) return error(res, 'No file uploaded', 400);

    const cvFileUrl = req.file.path;
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user.id },
      { cvFileUrl },
      { new: true }
    );
    return success(res, { cvFileUrl: profile.cvFileUrl });
  } catch (err) { next(err); }
};

const getCandidateStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'CANDIDATE') return error(res, 'Only candidates can access these stats', 403);

    const [applications, savedJobs, profile] = await Promise.all([
      Application.countDocuments({ candidateId: req.user.id }),
      SavedJob.countDocuments({ candidateId: req.user.id }),
      CandidateProfile.findOne({ userId: req.user.id })
    ]);

    let completionScore = 20; // Base score for having an account
    if (profile) {
      if (profile.title) completionScore += 10;
      if (profile.bio) completionScore += 10;
      if (profile.skills && profile.skills.length > 0) completionScore += 20;
      if (profile.experience && profile.experience.length > 0) completionScore += 20;
      if (profile.education && profile.education.length > 0) completionScore += 20;
    }

    return success(res, {
      totalApplications: applications,
      savedJobs,
      profileViews: profile ? profile.profileViews || 0 : 0,
      profileCompletionScore: Math.min(completionScore, 100)
    });
  } catch (err) { next(err); }
};

module.exports = {
  getProfile, updateProfile, getCandidateProfile, getEmployerProfile, getCv, saveCv, uploadAvatar, uploadCvFile, getCandidateStats
};
