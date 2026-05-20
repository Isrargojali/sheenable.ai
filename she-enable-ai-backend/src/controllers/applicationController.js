const Application = require('../models/Application');
const Job = require('../models/Job');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const EmployerProfile = require('../models/EmployerProfile');
const CandidateProfile = require('../models/CandidateProfile');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPaginationParams, getPaginationData } = require('../utils/paginate');
const { sendApplicationStatusEmail } = require('../utils/sendEmail');

const applyForJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return error(res, 'Job not found', 404);
    if (job.status !== 'PUBLISHED') return error(res, 'Job is not open for applications', 400);

    const existing = await Application.findOne({ jobId: job._id, candidateId: req.user.id });
    if (existing) return error(res, 'You have already applied for this job', 400);

    const application = await Application.create({
      jobId: job._id,
      candidateId: req.user.id,
      coverLetter: req.body.coverLetter || '',
      resumeUrl: req.body.resumeUrl || ''
    });

    job.applicationCount += 1;
    await job.save();

    return res.status(201).json({ success: true, data: application });
  } catch (err) { next(err); }
};

const getMyApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [applications, total] = await Promise.all([
      Application.find({ candidateId: req.user.id })
        .populate({ path: 'jobId', populate: { path: 'employerId', select: 'firstName lastName' } })
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments({ candidateId: req.user.id })
    ]);

    // Fetch employer profiles in batch to get actual companyName
    const employerIds = applications.map(app => app.jobId?.employerId?._id || app.jobId?.employerId).filter(Boolean);
    const profiles = await EmployerProfile.find({ userId: { $in: employerIds } }).lean();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const mapped = applications.map(app => {
      const job = app.jobId;
      if (!job) return null; // Filter out if job was deleted
      
      const empId = (job.employerId?._id || job.employerId || '').toString();
      const profile = profileMap.get(empId);
      const companyName = profile ? profile.companyName : (job.employerId?.firstName ? `${job.employerId.firstName} ${job.employerId.lastName}` : 'Company');

      return {
        id: app._id.toString(),
        stage: app.status, // maps status -> stage
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        aiMatchScore: app.aiMatchScore || 75,
        appliedAt: app.appliedAt,
        job: {
          id: job._id.toString(),
          title: job.title,
          location: job.location,
          salaryMin: job.salary?.min || 0,
          salaryMax: job.salary?.max || 0,
          employer: {
            companyName
          }
        }
      };
    }).filter(Boolean);

    return paginated(res, mapped, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return error(res, 'Job not found', 404);
    if (job.employerId.toString() !== req.user.id) return error(res, 'Not authorized', 403);

    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { jobId: job._id };
    if (req.query.status) filter.status = req.query.status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('candidateId', 'firstName lastName avatarUrl')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(filter)
    ]);

    const candidateIds = applications.map(app => app.candidateId?._id || app.candidateId).filter(Boolean);
    const profiles = await CandidateProfile.find({ userId: { $in: candidateIds } }).lean();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const mappedApplications = applications.map(app => {
      const candUser = app.candidateId;
      const candIdStr = (candUser?._id || candUser || '').toString();
      const profile = profileMap.get(candIdStr);
      
      const skillsList = profile?.skills ? profile.skills.map(s => s.name) : [];
      
      return {
        id: app._id.toString(),
        stage: app.status,
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        cand: {
          firstName: candUser?.firstName || 'Candidate',
          lastName: candUser?.lastName || '',
          title: profile?.title || 'Job Seeker',
          aiMatchScore: app.aiMatchScore || 75,
          skills: skillsList,
          avatarUrl: candUser?.avatarUrl || null
        },
        applied: new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    return paginated(res, mappedApplications, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

// FIX FOR BUG 8: N+1 query optimized using aggregation
const getPipeline = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return error(res, 'Job not found', 404);
    if (job.employerId.toString() !== req.user.id) return error(res, 'Not authorized', 403);

    const pipelineStats = await Application.aggregate([
      { $match: { jobId: job._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = { APPLIED: 0, SCREENING: 0, INTERVIEW: 0, OFFERED: 0, REJECTED: 0 };
    pipelineStats.forEach(s => { stats[s._id] = s.count; });

    return success(res, stats);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!status) return error(res, 'Status is required', 400);

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return error(res, 'Application not found', 404);

    if (application.jobId.employerId.toString() !== req.user.id) {
      return error(res, 'Not authorized', 403);
    }

    application.status = status;
    if (status === 'REJECTED' && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    await AuditLog.create({
      userId: req.user.id,
      action: 'APPLICATION_STATUS_UPDATE',
      resourceType: 'application',
      resourceId: application._id
    });

    const candidate = await User.findById(application.candidateId);
    if (candidate) {
      await sendApplicationStatusEmail(candidate.email, candidate.firstName, application.jobId.title, status);
    }

    return success(res, application);
  } catch (err) { next(err); }
};

// FIX FOR BUG 5: Enforce ownership on bulk updates
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { applicationIds, status } = req.body;
    if (!Array.isArray(applicationIds) || applicationIds.length === 0 || !status) {
      return error(res, 'Valid applicationIds array and status are required', 400);
    }

    // Verify ownership of ALL applications before updating ANY
    const applications = await Application.find({ _id: { $in: applicationIds } }).populate('jobId');
    if (applications.length !== applicationIds.length) {
      return error(res, 'One or more applications not found', 404);
    }

    const unauthorized = applications.some(app => app.jobId.employerId.toString() !== req.user.id);
    if (unauthorized) {
      return error(res, 'Not authorized to update one or more of these applications', 403);
    }

    await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { status } }
    );

    await AuditLog.create({
      userId: req.user.id,
      action: 'BULK_APPLICATION_STATUS_UPDATE',
      resourceType: 'application',
      changes: { count: applicationIds.length, status }
    });

    return success(res, null, `${applicationIds.length} applications updated successfully`);
  } catch (err) { next(err); }
};

module.exports = {
  applyForJob, getMyApplications, getJobApplications, getPipeline, updateStatus, bulkUpdateStatus
};
