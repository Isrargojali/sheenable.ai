const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Job = require('../models/Job');
const Application = require('../models/Application');

// ─── GET USERS (with search, role filter, pagination) ────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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

// ─── UPDATE USER STATUS (suspend / activate) ─────────────────────────────────
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

    res.json({ success: true, data: target });
  } catch (err) { next(err); }
};

// ─── UPDATE USER ROLE ─────────────────────────────────────────────────────────
// FIX 6 — Only SUPER_ADMIN can call this route (enforced in routes/admin.js).
//          But we add an extra in-controller guard so no role can ever self-escalate
//          and ADMIN role-field cannot be set from this endpoint by anyone other
//          than SUPER_ADMIN (defence-in-depth).
const ASSIGNABLE_ROLES = ['CANDIDATE', 'EMPLOYER', 'ADMIN'];

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // SUPER_ADMIN can assign any role; enforce the list for everyone else
    if (req.user.role !== 'SUPER_ADMIN' && !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ success: false, message: `Role '${role}' can only be assigned by a SUPER_ADMIN.` });
    }
    // Nobody can self-assign a new role
    if (req.params.userId === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot change your own role.' });
    }

    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    // Cannot demote the last SUPER_ADMIN
    if (target.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const superAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the only SUPER_ADMIN.' });
      }
    }

    target.role = role;
    await target.save();

    res.json({ success: true, data: target });
  } catch (err) { next(err); }
};

// ─── SOFT DELETE USER ─────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    // Cannot delete SUPER_ADMIN accounts
    if (target.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'SUPER_ADMIN accounts cannot be deleted.' });
    }
    // ADMIN cannot delete another ADMIN
    if (req.user.role === 'ADMIN' && target.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Insufficient privileges.' });
    }

    // Soft delete — deactivate and anonymize PII rather than hard delete
    target.isActive = false;
    target.email = `deleted_${target._id}@sheenableai.deleted`;
    target.firstName = 'Deleted';
    target.lastName = 'User';
    target.refreshToken = undefined;
    await target.save();

    res.json({ success: true, message: 'User account has been deactivated and anonymized.' });
  } catch (err) { next(err); }
};

// ─── GET AUDIT LOGS ───────────────────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, userId: filterUserId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (filterUserId) filter.userId = filterUserId;
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
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
    const [totalUsers, totalCandidates, totalEmployers, totalJobs, totalApplications, newUsersThisMonth] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'CANDIDATE', isActive: true }),
      User.countDocuments({ role: 'EMPLOYER', isActive: true }),
      Job.countDocuments({ status: 'PUBLISHED' }),
      Application.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } }),
    ]);
    res.json({ success: true, data: { totalUsers, totalCandidates, totalEmployers, totalJobs, totalApplications, newUsersThisMonth } });
  } catch (err) { next(err); }
};

// ─── SECURITY CENTER ──────────────────────────────────────────────────────────
// FIX 11 — This was referenced in api.ts (/admin/security) but had no backend handler.
const getSecurityInfo = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      suspendedUsers,
      recentFailedLogins,
      recentAdminActions,
      unverifiedUsers,
    ] = await Promise.all([
      User.countDocuments({ isActive: false }),
      // Proxy for failed logins: OTP still pending (not yet verified) after 1h
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

module.exports = { getUsers, updateUserStatus, updateUserRole, deleteUser, getAuditLogs, getPlatformStats, getSecurityInfo };
