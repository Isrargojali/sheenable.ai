const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const CandidateProfile = require('../models/CandidateProfile');
const AuditLog = require('../models/AuditLog');
const EmployerProfile = require('../models/EmployerProfile');
const Application = require('../models/Application');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPaginationParams, getPaginationData } = require('../utils/paginate');

const mapJobsList = async (jobs, userId = null) => {
  if (!jobs || jobs.length === 0) return [];

  const employerIds = jobs.map(j => j.employerId?._id || j.employerId).filter(Boolean);
  const profiles = await EmployerProfile.find({ userId: { $in: employerIds } }).lean();
  const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

  let appliedJobIds = new Set();
  if (userId) {
    const jobIds = jobs.map(j => j._id);
    const applications = await Application.find({ candidateId: userId, jobId: { $in: jobIds } }).lean();
    appliedJobIds = new Set(applications.map(a => a.jobId.toString()));
  }

  return jobs.map(job => {
    const empId = (job.employerId?._id || job.employerId || '').toString();
    const profile = profileMap.get(empId);
    const companyName = profile ? profile.companyName : (job.employerId?.firstName ? `${job.employerId.firstName} ${job.employerId.lastName}` : 'Company');
    
    return {
      id: job._id.toString(),
      title: job.title,
      description: job.description,
      category: job.category,
      employer: {
        companyName
      },
      type: job.jobType,
      mode: job.jobMode,
      isFeatured: job.isFeatured || false,
      isSaved: job.isSaved || false,
      hasApplied: appliedJobIds.has(job._id.toString()),
      skills: job.skillsRequired || [],
      salaryMin: job.salary?.min || 0,
      salaryMax: job.salary?.max || 0,
      salaryCurrency: job.salary?.currency || null,
      location: job.location,
      applicationCount: job.applicationCount || 0,
      viewCount: job.viewCount || 0,
      status: job.status,
      experienceRequired: job.experienceRequired || 0,
      aiScore: job.aiScore || (job.matchScore !== undefined ? Math.min(Math.round((job.matchScore / Math.max(job.skillsRequired?.length || 1, 1)) * 40 + 55), 99) : undefined),
      createdAt: job.createdAt
    };
  });
};


const logAudit = async (action, resourceId, req) => {
  try {
    await AuditLog.create({
      userId: req.user._id,
      action,
      resourceType: 'job',
      resourceId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) { console.error('AuditLog error:', err.message); }
};

const getJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { status: 'PUBLISHED' };
    
    // Future deadlines or no deadline
    filter.$or = [{ deadline: { $gt: Date.now() } }, { deadline: { $exists: false } }, { deadline: null }];

    if (req.query.search) filter.$text = { $search: req.query.search };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.jobType) filter.jobType = req.query.jobType;
    if (req.query.jobMode) filter.jobMode = req.query.jobMode;
    if (req.query.minSalary || req.query.maxSalary) {
      filter['salary.min'] = {};
      if (req.query.minSalary) filter['salary.min'].$gte = parseInt(req.query.minSalary);
      if (req.query.maxSalary) filter['salary.max'] = { $lte: parseInt(req.query.maxSalary) };
    }

    let sortOption = { createdAt: -1 };
    if (req.query.sort === 'salary') sortOption = { 'salary.max': -1 };
    if (req.query.sort === 'popular') sortOption = { applicationCount: -1 };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('employerId', 'firstName lastName')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter)
    ]);

    // If logged in candidate, add isSaved flag
    if (req.user && req.user.role === 'CANDIDATE') {
      const savedJobs = await SavedJob.find({ candidateId: req.user._id }).lean();
      const savedJobIds = new Set(savedJobs.map(s => s.jobId.toString()));
      jobs.forEach(job => {
        job.isSaved = savedJobIds.has(job._id.toString());
      });
    }

    const mapped = await mapJobsList(jobs, req.user?.role === 'CANDIDATE' ? req.user.id : null);

    return paginated(res, mapped, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: true })
      .populate('employerId', 'firstName lastName avatarUrl')
      .lean();
    
    if (!job) return error(res, 'Job not found', 404);

    if (req.user && req.user.role === 'CANDIDATE') {
      const savedJob = await SavedJob.findOne({ candidateId: req.user._id, jobId: job._id });
      job.isSaved = !!savedJob;
    }

    const mapped = await mapJobsList([job], req.user?.role === 'CANDIDATE' ? req.user.id : null);

    return success(res, mapped[0]);
  } catch (err) { next(err); }
};

const postJob = async (req, res, next) => {
  try {
    const { title, description, category, jobType, jobMode } = req.body;
    if (!title || !description || !category || !jobType || !jobMode) {
      return error(res, 'Missing required fields', 400);
    }

    const job = await Job.create({
      ...req.body,
      employerId: req.user.id,
      status: 'PUBLISHED',
      publishedAt: Date.now()
    });

    await logAudit('JOB_CREATED', job._id, req);

    return res.status(201).json({ success: true, data: job });
  } catch (err) { next(err); }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return error(res, 'Job not found', 404);

    if (job.employerId.toString() !== req.user.id) return error(res, 'Not authorized', 403);
    if (job.status === 'ARCHIVED') return error(res, 'Cannot edit archived job', 400);

    Object.assign(job, req.body);
    await job.save();

    await logAudit('JOB_UPDATED', job._id, req);

    return success(res, job);
  } catch (err) { next(err); }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return error(res, 'Job not found', 404);

    if (job.employerId.toString() !== req.user.id) return error(res, 'Not authorized', 403);

    job.status = 'ARCHIVED';
    await job.save();

    await logAudit('JOB_ARCHIVED', job._id, req);

    return success(res, null, 'Job successfully archived');
  } catch (err) { next(err); }
};

// FIX FOR BUG 7
const getMyListings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // max 50 per page
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status ? { status: req.query.status } : {};

    const query = { employerId: req.user.id, status: { $ne: 'ARCHIVED' }, ...statusFilter };
    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(query)
    ]);

    const mapped = await mapJobsList(jobs, null);

    return paginated(res, mapped, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const saveJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'PUBLISHED' });
    if (!job) return error(res, 'Job not found or not published', 404);

    const existing = await SavedJob.findOne({ candidateId: req.user.id, jobId: req.params.id });
    if (existing) {
      await SavedJob.findByIdAndDelete(existing._id);
      return success(res, { saved: false });
    } else {
      await SavedJob.create({ candidateId: req.user.id, jobId: req.params.id });
      return success(res, { saved: true });
    }
  } catch (err) { next(err); }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const savedJobs = await SavedJob.find({ candidateId: req.user.id })
      .populate({
        path: 'jobId',
        match: { status: 'PUBLISHED' },
        populate: { path: 'employerId', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 })
      .lean();

    const jobs = savedJobs.map(s => s.jobId).filter(Boolean); // filter out if job was deleted
    jobs.forEach(j => j.isSaved = true);

    const mapped = await mapJobsList(jobs, req.user.id);

    return success(res, mapped);
  } catch (err) { next(err); }
};

const getRecommendedJobs = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user.id });
    if (!profile || !profile.skills || profile.skills.length === 0) {
      return success(res, []);
    }

    const candidateSkills = profile.skills.map(s => s.name);

    const jobs = await Job.aggregate([
      { $match: { status: 'PUBLISHED', skillsRequired: { $in: candidateSkills } } },
      { $addFields: {
          matchScore: { $size: { $setIntersection: ["$skillsRequired", candidateSkills] } }
        }
      },
      { $sort: { matchScore: -1, createdAt: -1 } },
      { $limit: 10 }
    ]);

    await Job.populate(jobs, { path: 'employerId', select: 'firstName lastName' });
    
    // Add isSaved flag
    const savedJobs = await SavedJob.find({ candidateId: req.user.id }).lean();
    const savedJobIds = new Set(savedJobs.map(s => s.jobId.toString()));
    jobs.forEach(job => {
      job.isSaved = savedJobIds.has(job._id.toString());
    });

    const mapped = await mapJobsList(jobs, req.user.id);

    return success(res, mapped);
  } catch (err) { next(err); }
};

module.exports = {
  getJobs, getJobById, postJob, updateJob, deleteJob, getMyListings, saveJob, getSavedJobs, getRecommendedJobs
};
