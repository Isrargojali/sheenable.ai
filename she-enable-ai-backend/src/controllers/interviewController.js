const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPaginationParams, getPaginationData } = require('../utils/paginate');
const { sendInterviewScheduledEmail } = require('../services/emailService');
const logger = require('../utils/logger');

const scheduleInterview = async (req, res, next) => {
  try {
    const { applicationId, scheduledAt, durationMins, type, meetingLink, notes } = req.body;
    
    if (!applicationId || !scheduledAt) {
      return error(res, 'ApplicationId and scheduledAt are required', 400);
    }

    const application = await Application.findById(applicationId).populate('jobId');
    if (!application) return error(res, 'Application not found', 404);

    if (application.jobId.employerId.toString() !== req.user.id) {
      return error(res, 'Not authorized', 403);
    }

    const existingInterview = await Interview.findOne({ applicationId, status: { $ne: 'CANCELLED' } });
    if (existingInterview) {
      return error(res, 'An active interview is already scheduled for this application', 400);
    }

    const interview = await Interview.create({
      applicationId,
      interviewerId: req.user.id,
      candidateId: application.candidateId,
      scheduledAt,
      durationMins: durationMins || 60,
      type: type || 'VIDEO',
      meetingLink,
      notes
    });

    application.status = 'INTERVIEW';
    await application.save();

    try {
      const candidate = await User.findById(application.candidateId);
      if (candidate) {
        await sendInterviewScheduledEmail(candidate.email, candidate.firstName, application.jobId.title, scheduledAt, type, meetingLink);
      }
    } catch (emailErr) {
      logger.error('Failed to send interview scheduled email', {
        error: emailErr.message,
        candidateId: application.candidateId,
        jobTitle: application.jobId?.title,
        scheduledAt,
        type
      });
    }

    await AuditLog.create({
      userId: req.user.id,
      action: 'INTERVIEW_SCHEDULED',
      resourceType: 'interview',
      resourceId: interview._id
    });

    return res.status(201).json({ success: true, data: interview });
  } catch (err) { next(err); }
};

const getMyInterviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};
    
    if (req.user.role === 'CANDIDATE') {
      filter.candidateId = req.user.id;
    } else if (req.user.role === 'EMPLOYER') {
      filter.interviewerId = req.user.id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.upcoming === 'true') {
      filter.scheduledAt = { $gte: new Date() };
      filter.status = 'SCHEDULED';
    }

    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .populate({ path: 'applicationId', populate: { path: 'jobId', select: 'title' } })
        .populate('candidateId', 'firstName lastName avatarUrl')
        .populate('interviewerId', 'firstName lastName companyName')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Interview.countDocuments(filter)
    ]);

    return paginated(res, interviews, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate({ path: 'applicationId', populate: { path: 'jobId', select: 'title' } })
      .populate('candidateId', 'firstName lastName avatarUrl email')
      .populate('interviewerId', 'firstName lastName companyName email')
      .lean();

    if (!interview) return error(res, 'Interview not found', 404);

    const candidateIdStr = interview.candidateId?._id?.toString() || interview.candidateId?.toString() || '';
    const interviewerIdStr = interview.interviewerId?._id?.toString() || interview.interviewerId?.toString() || '';

    if (candidateIdStr !== req.user.id && interviewerIdStr !== req.user.id) {
      return error(res, 'Not authorized to view this interview', 403);
    }

    return success(res, interview);
  } catch (err) { next(err); }
};

const updateInterview = async (req, res, next) => {
  try {
    const { scheduledAt, durationMins, type, meetingLink, notes, status, rating } = req.body;
    
    const interview = await Interview.findById(req.params.id);
    if (!interview) return error(res, 'Interview not found', 404);

    if (interview.interviewerId.toString() !== req.user.id) {
      return error(res, 'Only the interviewer can update details', 403);
    }

    if (scheduledAt) interview.scheduledAt = scheduledAt;
    if (durationMins) interview.durationMins = durationMins;
    if (type) interview.type = type;
    if (meetingLink !== undefined) interview.meetingLink = meetingLink;
    if (notes !== undefined) interview.notes = notes;
    if (status) interview.status = status;
    if (rating) interview.rating = rating;

    await interview.save();

    await AuditLog.create({
      userId: req.user.id,
      action: 'INTERVIEW_UPDATED',
      resourceType: 'interview',
      resourceId: interview._id
    });

    return success(res, interview);
  } catch (err) { next(err); }
};

const cancelInterview = async (req, res, next) => {
  try {
    const { cancelReason } = req.body;
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) return error(res, 'Interview not found', 404);

    if (interview.candidateId.toString() !== req.user.id && interview.interviewerId.toString() !== req.user.id) {
      return error(res, 'Not authorized to cancel this interview', 403);
    }

    interview.status = 'CANCELLED';
    interview.cancelReason = cancelReason || 'No reason provided';
    interview.cancelledBy = req.user.id;
    await interview.save();

    // Revert application status to SCREENING if cancelled
    const application = await Application.findById(interview.applicationId);
    if (application && application.status === 'INTERVIEW') {
      application.status = 'SCREENING';
      await application.save();
    }

    await AuditLog.create({
      userId: req.user.id,
      action: 'INTERVIEW_CANCELLED',
      resourceType: 'interview',
      resourceId: interview._id
    });

    return success(res, interview, 'Interview cancelled successfully');
  } catch (err) { next(err); }
};

module.exports = {
  scheduleInterview, getMyInterviews, getInterviewById, updateInterview, cancelInterview
};
