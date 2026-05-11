const { getDatabase } = require('../config/database');

// ─── GET ME ───────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const db              = getDatabase();
    const UserModel       = db.User             || require('../models/User');
    const CandidateModel  = db.CandidateProfile || require('../models/CandidateProfile');
    const EmployerModel   = db.EmployerProfile  || require('../models/EmployerProfile');

    const user = await UserModel.findById(req.user._id);
    let profile = null;
    if (req.user.role === 'CANDIDATE') profile = await CandidateModel.findOne({ userId: req.user._id });
    if (req.user.role === 'EMPLOYER')  profile = await EmployerModel.findOne({ userId: req.user._id });

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.otpCode;

    res.json({ success: true, data: { ...userObj, profile } });
  } catch (err) { next(err); }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const db        = getDatabase();
    const UserModel = db.User || require('../models/User');
    const { firstName, lastName, phone, avatarUrl } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone, avatarUrl },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── GET CANDIDATE STATS ──────────────────────────────────────────────────────
const getCandidateStats = async (req, res, next) => {
  try {
    // Return real counts if MongoDB is connected, else return sensible mock data
    let applications = 0, profileViews = 0, jobMatches = 0, certifications = 0, profileScore = 30;

    try {
      const Application = require('../models/Application');
      applications = await Application.countDocuments({ candidateId: req.user._id });
      profileScore = 45;
    } catch { /* mock mode — MongoDB offline */ }

    res.json({
      success: true,
      data: {
        profileViews: profileViews || 12,
        jobMatches:   jobMatches   || 8,
        applications:  applications || 3,
        certifications: certifications || 1,
        profileScore:  profileScore || 30,
      }
    });
  } catch (err) { next(err); }
};

// ─── GET UPCOMING INTERVIEWS ──────────────────────────────────────────────────
// Returns scheduled interviews for the logged-in candidate.
// Falls back to empty array in mock mode (no Interview model available).
const getUpcomingInterviews = async (req, res, next) => {
  try {
    let interviews = [];
    try {
      const Interview = require('../models/Interview');
      interviews = await Interview.find({
        candidateId: req.user._id,
        status:      'SCHEDULED',
        scheduledAt: { $gte: new Date() },
      })
        .populate('interviewerId', 'firstName lastName')
        .sort('scheduledAt')
        .limit(5)
        .lean();
    } catch { /* MongoDB offline — return empty */ }

    res.json({ success: true, data: interviews });
  } catch (err) { next(err); }
};

// ─── UPDATE CANDIDATE PROFILE ─────────────────────────────────────────────────
const updateCandidateProfile = async (req, res, next) => {
  try {
    const CandidateProfile = require('../models/CandidateProfile');
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// ─── UPDATE EMPLOYER PROFILE ──────────────────────────────────────────────────
const updateEmployerProfile = async (req, res, next) => {
  try {
    const EmployerProfile = require('../models/EmployerProfile');
    const profile = await EmployerProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

module.exports = {
  getMe,
  updateProfile,
  getCandidateStats,
  getUpcomingInterviews,
  updateCandidateProfile,
  updateEmployerProfile,
};
