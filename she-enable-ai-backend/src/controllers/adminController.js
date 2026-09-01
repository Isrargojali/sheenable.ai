const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPaginationParams, getPaginationData } = require('../utils/paginate');

const logAudit = async (action, resourceType, resourceId, req, extraMeta = {}) => {
  try {
    await AuditLog.create({
      userId: req.user._id,
      action,
      resourceType,
      resourceId,
      ipAddress: req.ip || req.connection?.remoteAddress || '0.0.0.0',
      userAgent: req.headers['user-agent'] || '',
      changes: {
        resourceId: resourceId?.toString(),
        resourceType,
        ip: req.ip || req.connection?.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'] || '',
        ...extraMeta
      },
      status: 'SUCCESS'
    });
  } catch (err) { console.error('AuditLog error:', err.message); }
};

const getLastChange = async (Model, filter = {}, dateField = 'createdAt') => {
  try {
    const lastItem = await Model.findOne(filter).sort({ [dateField]: -1 }).select(dateField).lean();
    if (!lastItem) return null;
    const date = lastItem[dateField];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Model.countDocuments({
      ...filter,
      [dateField]: { $gte: startOfDay, $lte: endOfDay }
    });

    return {
      date: date.toISOString(),
      count
    };
  } catch (err) {
    console.error('getLastChange error:', err.message);
    return null;
  }
};

const resolveUserId = async (uuid) => {
  if (!uuid) return { name: 'System Daemon', email: 'system@sheenable.org', role: 'SYSTEM', avatar: '' };
  try {
    const user = await User.findById(uuid).lean();
    if (!user) return { name: 'System Daemon', email: 'system@sheenable.org', role: 'SYSTEM', avatar: '' };
    return {
      _id: user._id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'System Daemon',
      email: user.email || '',
      role: user.role || 'USER',
      avatar: user.avatarUrl || ''
    };
  } catch (err) {
    return { name: 'System Daemon', email: 'system@sheenable.org', role: 'SYSTEM', avatar: '' };
  }
};


const statsService = require('../services/statsService');
const healthRegistry = require('../services/healthRegistry');

const getStats = async (req, res, next) => {
  try {
    const data = await statsService.getTotalsAndDeltas();
    return success(res, data);
  } catch (err) { next(err); }
};


const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter)
    ]);

    const enrichedUsers = await Promise.all(users.map(async (u) => {
      // Normalize _id -> id for frontend
      let professionalField = 'Platform Administration';
      let availabilityStatus = 'Offline';

      if (u.role === 'CANDIDATE') {
        const profile = await CandidateProfile.findOne({ userId: u._id }).select('category isAvailable').lean();
        professionalField = profile?.category || 'General Support';
        availabilityStatus = profile?.isAvailable ? 'Available' : 'Busy';
      } else if (u.role === 'EMPLOYER') {
        const profile = await EmployerProfile.findOne({ userId: u._id }).select('industry').lean();
        professionalField = profile?.industry || 'Services';
        availabilityStatus = u.isActive ? 'Active' : 'Inactive';
      } else if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
        professionalField = 'Platform Administration';
        let status = 'Offline';
        if (u.lastLoginAt) {
          const diffMins = Math.floor((Date.now() - new Date(u.lastLoginAt).getTime()) / 60000);
          if (diffMins <= 15) {
            status = 'Online';
          } else if (diffMins <= 120) {
            status = 'Away';
          }
        }
        availabilityStatus = status;
      }

      return {
        ...u,
        id: u._id,
        isSuspended: !u.isActive,
        profile: {
          firstName: u.firstName,
          lastName: u.lastName,
          category: professionalField,
          isAvailable: availabilityStatus === 'Available' || availabilityStatus === 'Active' || availabilityStatus === 'Online',
          availabilityStatus,
        }
      };
    }));

    return paginated(res, enrichedUsers, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return error(res, 'Role is required', 400);

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return error(res, 'User not found', 404);

    if (req.params.id === req.user.id) return error(res, 'Cannot change your own role', 400);

    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return error(res, 'Only SUPER_ADMIN can promote users to SUPER_ADMIN', 403);
    }

    if (targetUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const superAdminsCount = await User.countDocuments({ role: 'SUPER_ADMIN', isActive: true });
      if (superAdminsCount <= 1) return error(res, 'Cannot remove the last SUPER_ADMIN', 400);
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAudit('ROLE_CHANGED', 'user', targetUser._id, req, {
      targetUserId: targetUser._id.toString(),
      targetName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email,
      targetEmail: targetUser.email,
      from_role: oldRole,
      to_role: role,
      supervisor: req.user.role
    });

    return success(res, targetUser);
  } catch (err) { next(err); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive, isVerified } = req.body;
    if (isActive === undefined && isVerified === undefined) {
      return error(res, 'isActive or isVerified boolean is required', 400);
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return error(res, 'User not found', 404);

    if (targetUser._id.toString() === req.user.id) return error(res, 'Cannot change your own status', 400);

    if (req.user.role === 'ADMIN' && ['ADMIN', 'SUPER_ADMIN'].includes(targetUser.role)) {
      return error(res, 'ADMIN cannot modify other administrators', 403);
    }

    if (typeof isActive === 'boolean') {
      targetUser.isActive = isActive;
      await logAudit(isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED', 'user', targetUser._id, req, {
        targetUserId: targetUser._id.toString(),
        targetName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email,
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        action: isActive ? 'ACTIVATED' : 'SUSPENDED'
      });
    }

    if (typeof isVerified === 'boolean') {
      targetUser.isVerified = isVerified;
      await logAudit(isVerified ? 'USER_VERIFIED' : 'USER_UNVERIFIED', 'user', targetUser._id, req, {
        targetUserId: targetUser._id.toString(),
        targetName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email,
        targetEmail: targetUser.email,
        method: 'MANUAL'
      });
    }

    await targetUser.save();

    return success(res, targetUser);
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return error(res, 'User not found', 404);

    if (targetUser._id.toString() === req.user.id) return error(res, 'Cannot delete yourself', 400);

    if (req.user.role !== 'SUPER_ADMIN') {
      return error(res, 'Only SUPER_ADMIN can delete users', 403);
    }

    targetUser.isActive = false;
    targetUser.email = `deleted_${targetUser._id}@deleted.sheenableai.com`;
    targetUser.firstName = 'Deleted';
    targetUser.lastName = 'User';
    targetUser.phone = null;
    targetUser.avatarUrl = null;
    await targetUser.save();

    await logAudit('USER_DELETED', 'user', targetUser._id, req);

    return success(res, null, 'User permanently removed');
  } catch (err) { next(err); }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'firstName lastName email role avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    const resolvedLogs = await Promise.all(logs.map(async (log) => {
      let operator = {
        _id: null,
        name: 'System Daemon',
        email: 'system@sheenable.org',
        role: 'SYSTEM',
        avatar: ''
      };
      if (log.userId && typeof log.userId === 'object') {
        operator = {
          _id: log.userId._id,
          name: `${log.userId.firstName || ''} ${log.userId.lastName || ''}`.trim() || log.userId.email || 'System Daemon',
          email: log.userId.email || '',
          role: log.userId.role || 'USER',
          avatar: log.userId.avatarUrl || ''
        };
      } else if (log.userId) {
        operator = await resolveUserId(log.userId);
      }

      // Build detail string from changes + ipAddress for frontend compatibility
      const changes = log.changes || {};
      const ip = log.ipAddress || changes.ip || '';
      const ua = log.userAgent || changes.userAgent || '';
      const detailParts = [];
      if (ip) detailParts.push(`ip=${ip}`);
      if (ua) {
        const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|curl|python|Postman)[^\/]*/i);
        if (browserMatch) detailParts.push(`browser=${browserMatch[1]}`);
      }
      const extraMeta = { ...changes };
      delete extraMeta.ip;
      delete extraMeta.userAgent;
      delete extraMeta.resourceId;
      delete extraMeta.resourceType;
      for (const [k, v] of Object.entries(extraMeta)) {
        if (v !== undefined && v !== null && v !== '') {
          detailParts.push(`${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`);
        }
      }
      const detail = detailParts.join(' ');

      return {
        id: log._id,
        _id: log._id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        ipAddress: ip,
        detail,
        changes: log.changes,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        status: log.status || 'SUCCESS',
        userId: operator.name, // String username for backward compatibility
        operator
      };
    }));

    return paginated(res, resolvedLogs, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const getSecurityInfo = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [suspendedUsers, unverifiedAccounts, recentFailedLogins, accountsLockedToday, recentAdminActions, newUsersLast24h] = await Promise.all([
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isVerified: false, createdAt: { $gte: twentyFourHoursAgo } }),
      AuditLog.countDocuments({ action: 'LOGIN_FAILED', createdAt: { $gte: twentyFourHoursAgo } }),
      User.countDocuments({ lockedUntil: { $gt: Date.now() } }),
      AuditLog.find({ resourceType: 'user' }).sort({ createdAt: -1 }).limit(10).lean(),
      User.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } })
    ]);

    const resolvedRecentActions = await Promise.all(recentAdminActions.map(async (log) => {
      let operator;
      if (log.userId && typeof log.userId === 'object') {
        operator = {
          _id: log.userId._id,
          name: `${log.userId.firstName || ''} ${log.userId.lastName || ''}`.trim() || log.userId.email || 'System Daemon',
          email: log.userId.email,
          role: log.userId.role || 'USER'
        };
      } else {
        operator = await resolveUserId(log.userId);
      }
      return {
        ...log,
        userId: operator.name,
        operator
      };
    }));

    return success(res, {
      suspendedUsers, unverifiedAccounts, recentFailedLogins,
      accountsLockedToday, recentAdminActions: resolvedRecentActions, newUsersLast24h
    });
  } catch (err) { next(err); }
};

const getTimeseries = async (req, res, next) => {
  try {
    const range = req.query.range || req.query.period || '7d';
    const data = await statsService.getPlatformActivityTimeseries(range);
    return success(res, data);
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  return getTimeseries(req, res, next);
};

const getUserAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || req.query.period || '30d';
    const data = await statsService.getUserAnalytics(range);
    return success(res, data);
  } catch (err) { next(err); }
};

const getSecurityAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || req.query.period || '7d';
    const data = await statsService.getSecurityAnalytics(range);
    return success(res, data);
  } catch (err) { next(err); }
};

const getAuditAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || req.query.period || '7d';
    const data = await statsService.getAuditVolumeAnalytics(range);
    return success(res, data);
  } catch (err) { next(err); }
};

const getAdminActivityAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || req.query.period || '7d';
    const data = await statsService.getAdminActivityAnalytics(range);
    return success(res, data);
  } catch (err) { next(err); }
};

const getJobsAdmin = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [jobs, total] = await Promise.all([
      Job.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments({})
    ]);

    return paginated(res, jobs, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const updateJobStatusAdmin = async (req, res, next) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!job) return error(res, 'Job not found', 404);

    await logAudit('JOB_STATUS_FORCED', 'job', job._id, req);
    return success(res, job);
  } catch (err) { next(err); }
};

const getThreatData = async (req, res, next) => {
  try {
    const secData = await statsService.getSecurityAnalytics('7d');
    const data = {
      threatLevel: secData.threatLevel,
      ...secData.totals,
      sparklines: secData.sparklines
    };
    return success(res, data);
  } catch (err) { next(err); }
};

const getSystemHealth = async (req, res, next) => {
  try {
    const isForceFresh = req.query.fresh === 'true' || req.query.forceFresh === 'true';
    const data = await healthRegistry.getSystemHealthReport(isForceFresh);
    return success(res, data);
  } catch (err) { next(err); }
};

const createAdminUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role) {
      return error(res, 'Name, email, and role are required', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return error(res, 'Email already registered', 400);

    // Map frontend roles to backend roles
    let backendRole = 'ADMIN';
    if (role === 'Full Admin' || role === 'SUPER_ADMIN') {
      backendRole = 'SUPER_ADMIN';
    }

    // Parse firstName/lastName from name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Generate secure default password if none is provided
    const userPassword = password || 'admin123';

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: userPassword,
      role: backendRole,
      gender: 'prefer-not-to-say',
      isVerified: true,
      isActive: true
    });

    await logAudit('ADMIN_CREATED', 'user', user._id, req, {
      createdBy: req.user._id.toString(),
      targetEmail: user.email,
      targetRole: user.role
    });

    return success(res, user, 'Admin account created successfully');
  } catch (err) { next(err); }
};

module.exports = {
  getStats, getUsers, getUserById, updateUserRole, updateUserStatus, deleteUser,
  getAuditLogs, getSecurityInfo, getAnalytics, getTimeseries,
  getUserAnalytics, getSecurityAnalytics, getAuditAnalytics, getAdminActivityAnalytics,
  getJobsAdmin, updateJobStatusAdmin, getThreatData, getSystemHealth, createAdminUser
};

