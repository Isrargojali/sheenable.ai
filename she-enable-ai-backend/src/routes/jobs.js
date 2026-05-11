const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');
const protect  = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const optionalAuth = require('../middleware/optionalAuth'); // we'll write this below
const {
  getJobs, getJobById, createJob, updateJob,
  deleteJob, getMyListings, saveJob, getSavedJobs, applyToJob,
} = require('../controllers/jobController');

// Validation rules for creating/updating a job
const jobValidation = [
  body('title').trim().isLength({ max: 255 }).withMessage('Job title must be max 255 characters').notEmpty().withMessage('Job title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('jobType').isIn(['FULLTIME','PARTTIME','CONTRACT','INTERNSHIP']).withMessage('Invalid job type'),
  body('jobMode').isIn(['REMOTE','HYBRID','ONSITE']).withMessage('Invalid job mode'),
  body('salaryMin').optional().isNumeric().withMessage('Salary must be a number'),
  body('salaryMax').optional().isNumeric().withMessage('Salary must be a number'),
];

// ── Public / Candidate routes ─────────────────────────────────────────────
// optionalAuth: attaches req.user IF token present, but doesn't block if not
router.get('/',              optionalAuth, getJobs);
router.get('/saved',         protect, authorizeRoles('CANDIDATE'), getSavedJobs);
router.get('/my-listings',   protect, authorizeRoles('EMPLOYER'),  getMyListings);
// Recommendations: return latest published jobs as simple recommendations
router.get('/recommendations', optionalAuth, async (req, res, next) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ status: 'PUBLISHED' })
      .sort('-createdAt')
      .limit(6)
      .populate('employerId', 'firstName lastName')
      .lean();
    // Attach a mock AI score for UI display purposes
    const enriched = jobs.map((j, i) => ({ ...j, id: j._id, aiScore: 95 - i * 5 }));
    res.json({ success: true, data: enriched });
  } catch {
    // MongoDB offline — return empty array (dashboard handles null gracefully)
    res.json({ success: true, data: [] });
  }
});
router.get('/:id',           optionalAuth, getJobById);

// ── Employer-only routes ──────────────────────────────────────────────────
router.post('/',    protect, authorizeRoles('EMPLOYER'), jobValidation, createJob);
router.put('/:id',  protect, authorizeRoles('EMPLOYER'), updateJob);
router.delete('/:id',protect, authorizeRoles('EMPLOYER','ADMIN','SUPER_ADMIN'), deleteJob);

// ── Candidate-only routes ─────────────────────────────────────────────────
router.post('/:id/save',  protect, authorizeRoles('CANDIDATE'), saveJob);
router.delete('/:id/save',protect, authorizeRoles('CANDIDATE'), saveJob); // same fn handles both
router.post('/:id/apply', protect, authorizeRoles('CANDIDATE'), applyToJob);

module.exports = router;