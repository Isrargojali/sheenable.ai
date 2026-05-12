const Interview   = require('../models/Interview');
const Application = require('../models/Application');
const Job         = require('../models/Job');
const Notification= require('../models/Notification');
const { isMongoConnected } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { sendInterviewScheduledEmail } = require('../services/emailService');
const User = require('../models/User');

// Validation rules exposed so routes can use them
const interviewValidation = [
  body('applicationId').notEmpty().withMessage('applicationId is required'),
  body('candidateId').notEmpty().withMessage('candidateId is required'),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  body('type').optional().isIn(['PHONE', 'VIDEO', 'IN_PERSON']).withMessage('Invalid interview type'),
  body('durationMins').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('meetingLink').optional().isURL().withMessage('meetingLink must be a valid URL'),
];

// ─── SCHEDULE INTERVIEW ───────────────────────────────────────────────────────
const scheduleInterview = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable. Cannot schedule interviews in offline mode.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { applicationId, candidateId, scheduledAt, type, durationMins, meetingLink, notes } = req.body;

    const application = await Application.findById(applicationId).populate('jobId');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (application.jobId.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorised to schedule this interview.' });
    }
    if (!['SCREENING', 'INTERVIEW'].includes(application.status)) {
      return res.status(400).json({ success: false, message: `Cannot schedule interview for application with status '${application.status}'.` });
    }

    const existing = await Interview.findOne({ applicationId, status: 'SCHEDULED' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An interview is already scheduled for this application.' });
    }

    const interview = await Interview.create({
      applicationId,
      interviewerId: req.user._id,
      candidateId,
      scheduledAt,
      type:         type         || 'VIDEO',
      durationMins: durationMins || 60,
      meetingLink:  meetingLink  || '',
      notes:        notes        || '',
    });

    // Move application to INTERVIEW status if still in SCREENING
    if (application.status === 'SCREENING') {
      application.status = 'INTERVIEW';
      application.statusHistory.push({ status: 'INTERVIEW', changedBy: req.user._id, note: 'Interview scheduled' });
      await application.save();
    }

    // Notify the candidate
    await Notification.create({
      userId:      candidateId,
      type:        'INTERVIEW',
      title:       `Interview scheduled: ${application.jobId.title}`,
      body:        `Your interview is scheduled for ${new Date(scheduledAt).toLocaleString()}`,
      relatedId:   interview._id,
      relatedType: 'Interview',
    });

    // Send email to candidate
    try {
      const candidate = await User.findById(candidateId).select('email firstName');
      if (candidate) {
        await sendInterviewScheduledEmail(
          candidate.email, candidate.firstName, application.jobId.title, scheduledAt, type || 'VIDEO', meetingLink || ''
        );
      }
    } catch {}

    const io = req.app.get('io');
    if (io) {
      io.to(candidateId.toString()).emit('interview-scheduled', {
        interviewId: interview._id,
        jobTitle:    application.jobId.title,
        scheduledAt,
      });
    }

    res.status(201).json({ success: true, data: interview });
  } catch (err) { next(err); }
};

// ─── GET INTERVIEWS ───────────────────────────────────────────────────────────
const getInterviews = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const filter = req.user.role === 'CANDIDATE'
      ? { candidateId: req.user._id }
      : { interviewerId: req.user._id };

    const { status } = req.query;
    if (status) filter.status = status;

    const interviews = await Interview.find(filter)
      .populate('applicationId', 'jobId status')
      .populate('candidateId',   'firstName lastName email avatarUrl')
      .populate('interviewerId', 'firstName lastName email')
      .sort('scheduledAt');

    res.json({ success: true, count: interviews.length, data: interviews });
  } catch (err) { next(err); }
};

// ─── GET SINGLE INTERVIEW ─────────────────────────────────────────────────────
const getInterviewById = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(404).json({ success: false, message: 'Interview not found (offline).' });
    }
    const interview = await Interview.findById(req.params.id)
      .populate('applicationId', 'jobId status')
      .populate('candidateId',   'firstName lastName email avatarUrl')
      .populate('interviewerId', 'firstName lastName email');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });

    const isParticipant =
      interview.interviewerId._id.toString() === req.user._id.toString() ||
      interview.candidateId._id.toString()   === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorised.' });

    res.json({ success: true, data: interview });
  } catch (err) { next(err); }
};

// ─── UPDATE INTERVIEW ─────────────────────────────────────────────────────────
const updateInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });

    if (interview.interviewerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    const UPDATABLE = ['scheduledAt', 'type', 'durationMins', 'meetingLink', 'notes', 'status', 'rating'];
    UPDATABLE.forEach(field => { if (req.body[field] !== undefined) interview[field] = req.body[field]; });

    await interview.save();

    await Notification.create({
      userId:      interview.candidateId,
      type:        'INTERVIEW',
      title:       'Interview updated',
      body:        'Your interview details have been updated.',
      relatedId:   interview._id,
      relatedType: 'Interview',
    });

    res.json({ success: true, data: interview });
  } catch (err) { next(err); }
};

// ─── CANCEL INTERVIEW ─────────────────────────────────────────────────────────
const cancelInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });

    const isParticipant =
      interview.interviewerId.toString() === req.user._id.toString() ||
      interview.candidateId.toString()   === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorised.' });
    if (interview.status !== 'SCHEDULED') {
      return res.status(400).json({ success: false, message: `Cannot cancel interview with status '${interview.status}'.` });
    }

    const { cancelReason } = req.body;
    interview.status      = 'CANCELLED';
    interview.cancelledBy = req.user._id;
    interview.cancelReason = cancelReason || '';
    await interview.save();

    // Revert application to SCREENING
    try {
      const app = await Application.findById(interview.applicationId);
      if (app && app.status === 'INTERVIEW') {
        app.status = 'SCREENING';
        app.statusHistory.push({ status: 'SCREENING', changedBy: req.user._id, note: 'Interview cancelled' });
        await app.save();
      }
    } catch {}

    // Notify the other party
    const notifyId = req.user._id.toString() === interview.interviewerId.toString()
      ? interview.candidateId
      : interview.interviewerId;

    await Notification.create({
      userId:      notifyId,
      type:        'INTERVIEW',
      title:       'Interview cancelled',
      body:        cancelReason ? `Interview cancelled: ${cancelReason}` : 'An interview has been cancelled.',
      relatedId:   interview._id,
      relatedType: 'Interview',
    });

    res.json({ success: true, message: 'Interview cancelled.' });
  } catch (err) { next(err); }
};

module.exports = { scheduleInterview, getInterviews, getInterviewById, updateInterview, cancelInterview, interviewValidation };
