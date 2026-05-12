const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { isMongoConnected } = require('../config/database');

// ─── GET ALL USERS (with search, role filter, pagination) ─────────────────────
const getUsers = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, total: 0, totalPages: 0, currentPage: 1, data: [] });
    }
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -refreshToken -otpCode -otpExpiry -passwordResetToken -passwordResetExpiry')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    res.json({ success: true, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), data: users });
  } catch (err) { next(err); }
};

// ─── GET USER BY ID ───────────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(404).json({ success: false, message: 'User not found (offline).' });
    }
    const user = await User.findById(req.params.userId)
      .select('-password -refreshToken -otpCode -otpExpiry -passwordResetToken -passwordResetExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── UPDATE USER STATUS (suspend / activate) ──────────────────────────────────
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    }

    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    // ADMIN cannot suspend another ADMIN or SUPER_ADMIN
    if (req.user.role === 'ADMIN' && ['ADMIN', 'SUPER_ADMIN'].includes(target.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient privileges to change this user\'s status.' });
    }

    target.isActive = isActive;
    await target.save();

    // Log action
    try {
      await AuditLog.create({
        userId:       req.user._id,
        action:       isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
        resourceType: 'User',
        resourceId:   target._id,
        changes:      { isActive },
        ipAddress:    req.ip,
        userAgent:    req.headers['user-agent'],
      });
    } catch {}

    res.json({ success: true, data: target });
  } catch (err) { next(err); }
};

// ─── UPDATE USER ROLE ─────────────────────────────────────────────────────────
const ASSIGNABLE_ROLES = ['CANDIDATE', 'EMPLOYER', 'ADMIN'];

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (req.user.role !== 'SUPER_ADMIN' && !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ success: false, message: `Role '${role}' can only be assigned by a SUPER_ADMIN.` });
    }
    if (req.params.userId === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot change your own role.' });
    }

    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    if (target.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the only SUPER_ADMIN.' });
      }
    }

    const previousRole = target.role;
    target.role = role;
    await target.save();

    try {
      await AuditLog.create({
        userId:       req.user._id,
        action:       'USER_ROLE_CHANGED',
        resourceType: 'User',
        resourceId:   target._id,
        changes:      { from: previousRole, to: role },
        ipAddress:    req.ip,
        userAgent:    req.headers['user-agent'],
      });
    } catch {}

    res.json({ success: true, data: target });
  } catch (err) { next(err); }
};

// ─── SOFT DELETE USER ─────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    if (target.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'SUPER_ADMIN accounts cannot be deleted.' });
    }
    if (req.user.role === 'ADMIN' && target.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Insufficient privileges.' });
    }

    // Soft delete — deactivate and anonymize PII
    target.isActive   = false;
    target.email      = `deleted_${target._id}@sheenableai.deleted`;
    target.firstName  = 'Deleted';
    target.lastName   = 'User';
    target.phone      = '';
    target.refreshToken = undefined;
    await target.save();

    try {
      await AuditLog.create({
        userId:       req.user._id,
        action:       'USER_DELETED',
        resourceType: 'User',
        resourceId:   target._id,
        changes:      { softDelete: true },
        ipAddress:    req.ip,
        userAgent:    req.headers['user-agent'],
      });
    } catch {}

    res.json({ success: true, message: 'User account has been deactivated and anonymized.' });
  } catch (err) { next(err); }
};

// ─── GET AUDIT LOGS ───────────────────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, total: 0, totalPages: 0, currentPage: 1, data: [] });
    }
    const { page = 1, limit = 50, action, userId: filterUserId, from, to } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (action)       filter.action = { $regex: action, $options: 'i' };
    if (filterUserId) filter.userId = filterUserId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    const total = await AuditLog.countDocuments(filter);
    const logs  = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    res.json({ success: true, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), data: logs });
  } catch (err) { next(err); }
};

// ─── GET PLATFORM STATS ───────────────────────────────────────────────────────
const getPlatformStats = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, data: {
        totalUsers: 0, totalCandidates: 0, totalEmployers: 0,
        totalJobs: 0, totalApplications: 0, newUsersThisMonth: 0,
        successfulHires: 0, activeJobs: 0,
      }});
    }
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [totalUsers, totalCandidates, totalEmployers, totalJobs, totalApplications,
           newUsersThisMonth, successfulHires, activeJobs] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'CANDIDATE', isActive: true }),
      User.countDocuments({ role: 'EMPLOYER', isActive: true }),
      Job.countDocuments({ status: 'PUBLISHED' }),
      Application.countDocuments(),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Application.countDocuments({ status: 'OFFERED' }),
      Job.countDocuments({ status: 'PUBLISHED' }),
    ]);
    res.json({ success: true, data: {
      totalUsers, totalCandidates, totalEmployers, totalJobs,
      totalApplications, newUsersThisMonth, successfulHires, activeJobs,
    }});
  } catch (err) { next(err); }
};

// ─── SECURITY CENTER ──────────────────────────────────────────────────────────
const getSecurityInfo = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, data: {
        suspendedUsers: 0, unverifiedUsers: 0,
        recentPendingRegistrations: 0, recentAdminActions: [], generatedAt: new Date().toISOString(),
      }});
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [suspendedUsers, recentFailedLogins, recentAdminActions, unverifiedUsers] = await Promise.all([
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isVerified: false, createdAt: { $gte: thirtyDaysAgo } }),
      AuditLog.find({ createdAt: { $gte: thirtyDaysAgo } })
        .populate('userId', 'firstName lastName email role')
        .sort('-createdAt')
        .limit(20),
      User.countDocuments({ isVerified: false }),
    ]);
    res.json({
      success: true,
      data: {
        suspendedUsers,
        unverifiedUsers,
        recentPendingRegistrations: recentFailedLogins,
        recentAdminActions,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};

// ─── GET ANALYTICS (daily buckets by period) ──────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, data: { users: [], jobs: [], applications: [], period: req.query.period || '30d' } });
    }
    const period = req.query.period || '30d';
    const days   = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since  = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dateGroup = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [users, jobs, applications] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: dateGroup, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Job.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: dateGroup, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Application.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: dateGroup, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ success: true, data: { users, jobs, applications, period } });
  } catch (err) { next(err); }
};

// ─── ADMIN JOB MANAGEMENT ─────────────────────────────────────────────────────
const getJobsAdmin = async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, total: 0, data: [] });
    }
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const total = await Job.countDocuments(filter);
    const jobs  = await Job.find(filter)
      .populate('employerId', 'firstName lastName email')
      .sort('-createdAt').skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), data: jobs });
  } catch (err) { next(err); }
};

const updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` });
    }
    const job = await Job.findByIdAndUpdate(req.params.jobId, { status }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    try {
      await AuditLog.create({
        userId: req.user._id, action: 'JOB_STATUS_CHANGED',
        resourceType: 'Job', resourceId: job._id,
        changes: { status }, ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });
    } catch {}
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

module.exports = {
  getUsers, getUserById, updateUserStatus, updateUserRole, deleteUser,
  getAuditLogs, getPlatformStats, getSecurityInfo, getAnalytics,
  getJobsAdmin, updateJobStatus,
};
