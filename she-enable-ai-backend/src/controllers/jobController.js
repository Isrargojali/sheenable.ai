const Job = require('../models/Job');
const Application = require('../models/Application');
const CandidateProfile = require('../models/CandidateProfile');
const Notification = require('../models/Notification');
const ApiFeatures = require('../utils/apiFeatures');
const { isMongoConnected } = require('../config/database');

const getJobs = async (req, res, next) => {
  if (!isMongoConnected()) {
    return res.json({ success: true, count: 0, total: 0, totalPages: 0, currentPage: 1, data: [] });
  }
  try {
    const total = await Job.countDocuments({ status: 'PUBLISHED' });
    const features = new ApiFeatures(Job.find({ status: 'PUBLISHED' }), req.query)
      .search(['title', 'description']).filter().sort().paginate(10);
    const jobs = await features.query.lean();

    let savedJobIds = [], appliedJobIds = [];
    if (req.user && req.user.role === 'CANDIDATE') {
      const profile = await CandidateProfile.findOne({ userId: req.user._id }).select('savedJobs');
      savedJobIds = profile?.savedJobs?.map(id => id.toString()) || [];
      const applications = await Application.find({ candidateId: req.user._id }).select('jobId');
      appliedJobIds = applications.map(a => a.jobId.toString());
    }

    const jobsWithFlags = jobs.map(job => ({ ...job, isSaved: savedJobIds.includes(job._id.toString()), hasApplied: appliedJobIds.includes(job._id.toString()) }));

    res.json({ success: true, count: jobs.length, total, totalPages: Math.ceil(total / (features.limit || 10)), currentPage: features.page || 1, data: jobsWithFlags });
  } catch (err) { next(err); }
};

const getJobById = async (req, res, next) => {
  if (!isMongoConnected()) {
    return res.status(404).json({ success: false, message: 'Job not found (offline).' });
  }
  try {
    const job = await Job.findById(req.params.id).populate('employerId', 'firstName lastName email').lean();
    if (!job || job.status === 'ARCHIVED') return res.status(404).json({ success: false, message: 'Job not found.' });
    Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({ ...req.body, employerId: req.user._id, publishedAt: req.body.status === 'PUBLISHED' ? new Date() : null });
    res.status(201).json({ success: true, data: job });
  } catch (err) { next(err); }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.employerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    const isOwner = job.employerId.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    job.status = 'ARCHIVED';
    await job.save();
    res.json({ success: true, message: 'Job removed.' });
  } catch (err) { next(err); }
};

// FIX 7 — Added pagination (was unbounded — could return all jobs in one query)
const getMyListings = async (req, res, next) => {
  if (!isMongoConnected()) {
    return res.json({ success: true, count: 0, total: 0, totalPages: 0, currentPage: 1, data: [] });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = { employerId: req.user._id, status: { $ne: 'ARCHIVED' } };
    if (status) filter.status = status;

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter).sort('-createdAt').skip(skip).limit(limit);
    res.json({ success: true, count: jobs.length, total, totalPages: Math.ceil(total / limit), currentPage: page, data: jobs });
  } catch (err) { next(err); }
};

const saveJob = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    const alreadySaved = profile.savedJobs && profile.savedJobs.map(id => id.toString()).includes(req.params.id);
    if (alreadySaved) {
      profile.savedJobs = profile.savedJobs.filter(id => id.toString() !== req.params.id);
      await profile.save();
      return res.json({ success: true, saved: false, message: 'Job removed from saved.' });
    }
    if (!profile.savedJobs) profile.savedJobs = [];
    profile.savedJobs.push(req.params.id);
    await profile.save();
    res.json({ success: true, saved: true, message: 'Job saved.' });
  } catch (err) { next(err); }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id }).populate({ path: 'savedJobs', match: { status: 'PUBLISHED' } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({ success: true, count: profile.savedJobs.length, data: profile.savedJobs });
  } catch (err) { next(err); }
};

const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.status !== 'PUBLISHED') return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.deadline && new Date() > job.deadline) return res.status(400).json({ success: false, message: 'Application deadline has passed.' });
    const existing = await Application.findOne({ jobId: req.params.id, candidateId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied.' });
    const profile = await CandidateProfile.findOne({ userId: req.user._id }).select('cvUrl');
    const application = await Application.create({ jobId: req.params.id, candidateId: req.user._id, coverLetter: req.body.coverLetter || '', resumeUrl: profile?.cvUrl || '', status: 'APPLIED', statusHistory: [{ status: 'APPLIED', changedBy: req.user._id }] });
    await Job.findByIdAndUpdate(req.params.id, { $inc: { applicationCount: 1 } });
    const io = req.app.get('io');
    if (io) io.to(job.employerId.toString()).emit('new-application', { jobId: job._id, jobTitle: job.title });
    await Notification.create({ userId: job.employerId, type: 'APPLICATION_STATUS', title: 'New Application', body: `Someone applied to "${job.title}"`, relatedId: application._id, relatedType: 'Application' });
    res.status(201).json({ success: true, message: 'Application submitted.', data: application });
  } catch (err) { next(err); }
};

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, getMyListings, saveJob, getSavedJobs, applyToJob };
