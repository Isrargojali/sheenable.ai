const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Notification = require('../models/Notification');
const { sendApplicationStatusEmail } = require('../services/emailService');

const ALLOWED_TRANSITIONS = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFERED', 'REJECTED'],
  OFFERED: ['REJECTED'],
  REJECTED: [],
  WITHDRAWN: [],
};

const getApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let filter = {};
    if (req.user.role === 'CANDIDATE') filter.candidateId = req.user._id;
    else if (req.user.role === 'EMPLOYER') {
      const jobs = await Job.find({ employerId: req.user._id }).select('_id');
      filter.jobId = { $in: jobs.map(j => j._id) };
    }
    if (status) filter.status = status;
    const total = await Application.countDocuments(filter);
    const applications = await Application.find(filter).populate('jobId', 'title location jobType jobMode salaryMin salaryMax').populate('candidateId', 'firstName lastName email avatarUrl').sort('-createdAt').skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), count: applications.length, data: applications });
  } catch (err) { next(err); }
};

const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId').populate('candidateId', 'firstName lastName email avatarUrl').populate('statusHistory.changedBy', 'firstName lastName role');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    const job = await Job.findById(application.jobId);
    const isCandidate = application.candidateId._id.toString() === req.user._id.toString();
    const isEmployer = job?.employerId.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isCandidate && !isEmployer && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (isCandidate && !application.isReadByCandidate) await Application.findByIdAndUpdate(req.params.id, { isReadByCandidate: true });
    let candidateProfile = null;
    if (isEmployer || isAdmin) candidateProfile = await CandidateProfile.findOne({ userId: application.candidateId._id }).select('title bio skills experience education cvUrl');
    res.json({ success: true, data: { ...application.toObject(), candidateProfile } });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, note, rejectionReason, offerDetails } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    const job = await Job.findById(application.jobId);
    if (!job || job.employerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
    const allowed = ALLOWED_TRANSITIONS[application.status];
    if (!allowed || !allowed.includes(status)) return res.status(400).json({ success: false, message: `Cannot move from ${application.status} to ${status}.`, allowedTransitions: allowed });
    const previousStatus = application.status;
    application.status = status;
    application.isReadByCandidate = false;
    application.statusHistory.push({ status, changedBy: req.user._id, changedAt: new Date(), note: note || '' });
    if (status === 'REJECTED') { application.rejectionReason = rejectionReason || ''; application.rejectedAt = new Date(); }
    if (status === 'OFFERED' && offerDetails) application.offerDetails = offerDetails;
    await application.save();
    const candidate = await User.findById(application.candidateId);
    try { await sendApplicationStatusEmail(candidate.email, candidate.firstName, job.title, status, rejectionReason); } catch { }
    await Notification.create({ userId: application.candidateId, type: 'APPLICATION_STATUS', title: `Application update for "${job.title}"`, body: `Your application status changed to ${status}`, relatedId: application._id, relatedType: 'Application' });
    const io = req.app.get('io');
    if (io) io.to(application.candidateId.toString()).emit('application-update', { applicationId: application._id, jobTitle: job.title, newStatus: status, previousStatus });
    res.json({ success: true, message: `Application moved to ${status}.`, data: application });
  } catch (err) { next(err); }
};

const withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (application.candidateId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not your application.' });
    if (['OFFERED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) return res.status(400).json({ success: false, message: `Cannot withdraw with status: ${application.status}` });
    application.status = 'WITHDRAWN';
    application.withdrawnAt = new Date();
    application.withdrawalReason = req.body.reason || '';
    application.statusHistory.push({ status: 'WITHDRAWN', changedBy: req.user._id, note: req.body.reason || '' });
    await application.save();
    await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationCount: -1 } });
    res.json({ success: true, message: 'Application withdrawn.' });
  } catch (err) { next(err); }
};

const getPipeline = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (job.employerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not your job.' });

    // FIX 8 — Replace N+1 individual CandidateProfile queries with a single
    // populate call followed by one bulk CandidateProfile fetch.
    const applications = await Application.find({ jobId: req.params.jobId, status: { $ne: 'WITHDRAWN' } })
      .populate('candidateId', 'firstName lastName email avatarUrl')
      .lean();

    // Fetch all relevant candidate profiles in ONE query
    const candidateIds = applications.map(a => a.candidateId._id);
    const profiles = await CandidateProfile.find({ userId: { $in: candidateIds } })
      .select('userId title skills yearsOfExperience cvUrl')
      .lean();
    const profileMap = Object.fromEntries(profiles.map(p => [p.userId.toString(), p]));

    const pipeline = { APPLIED: [], SCREENING: [], INTERVIEW: [], OFFERED: [], REJECTED: [] };
    for (const app of applications) {
      const profile = profileMap[app.candidateId._id.toString()] || null;
      const enriched = { ...app, profile, allowedTransitions: ALLOWED_TRANSITIONS[app.status] };
      if (pipeline[app.status]) pipeline[app.status].push(enriched);
    }

    res.json({
      success: true,
      job: { _id: job._id, title: job.title, applicationCount: job.applicationCount },
      pipeline,
      totals: Object.fromEntries(Object.entries(pipeline).map(([k, v]) => [k, v.length])),
    });
  } catch (err) { next(err); }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { applicationIds, status, note, rejectionReason } = req.body;
    if (!applicationIds?.length || !status) {
      return res.status(400).json({ success: false, message: 'applicationIds and status required.' });
    }

    // FIX 5 — Pre-load all jobs owned by this employer so we can verify ownership
    // without hitting the DB inside the loop (also prevents N+1).
    const myJobs = await Job.find({ employerId: req.user._id }).select('_id').lean();
    const myJobIds = new Set(myJobs.map(j => j._id.toString()));

    const results = { success: [], failed: [] };

    await Promise.all(applicationIds.map(async (appId) => {
      try {
        const app = await Application.findById(appId);
        if (!app) { results.failed.push({ id: appId, reason: 'Not found' }); return; }

        // FIX 5 — Verify the employer actually owns this application's job
        if (!myJobIds.has(app.jobId.toString())) {
          results.failed.push({ id: appId, reason: 'Not authorized for this application' });
          return;
        }

        if (!ALLOWED_TRANSITIONS[app.status]?.includes(status)) {
          results.failed.push({ id: appId, reason: `Cannot move from ${app.status} to ${status}` });
          return;
        }

        app.status = status;
        app.isReadByCandidate = false;
        app.statusHistory.push({ status, changedBy: req.user._id, changedAt: new Date(), note: note || '' });
        if (status === 'REJECTED') { app.rejectionReason = rejectionReason || ''; app.rejectedAt = new Date(); }
        await app.save();
        results.success.push(appId);
      } catch (err) { results.failed.push({ id: appId, reason: err.message }); }
    }));

    res.json({
      success: true,
      message: `${results.success.length} updated, ${results.failed.length} failed.`,
      results,
    });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).select('_id title');
    const myJobIds = jobs.map(j => j._id);
    const statusCounts = await Application.aggregate([{ $match: { jobId: { $in: myJobIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const stats = statusCounts.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyApps = await Application.aggregate([{ $match: { jobId: { $in: myJobIds }, createdAt: { $gte: thirtyDaysAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    res.json({ success: true, data: { summary: { total: Object.values(stats).reduce((a, b) => a + b, 0), applied: stats.APPLIED || 0, screening: stats.SCREENING || 0, interview: stats.INTERVIEW || 0, offered: stats.OFFERED || 0, rejected: stats.REJECTED || 0 }, dailyApplications: dailyApps, totalJobs: jobs.length } });
  } catch (err) { next(err); }
};

const updateNotes = async (req, res, next) => {
  try {
    await Application.findByIdAndUpdate(req.params.id, { employerNotes: req.body.notes });
    res.json({ success: true, message: 'Notes saved.' });
  } catch (err) { next(err); }
};

module.exports = { getApplications, getApplicationById, updateStatus, withdrawApplication, getPipeline, bulkUpdateStatus, getStats, updateNotes };
