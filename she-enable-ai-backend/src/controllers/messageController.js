const MessageThread = require('../models/MessageThread');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPaginationParams, getPaginationData } = require('../utils/paginate');
// Socket dependency is required differently since it's global or passed, but we can assume we'll use a getter if needed.
// For now, we'll just save it to DB. The actual socket logic will emit events on its own or we can require getIo.
// In server.js, we will set global.io.

const getMyThreads = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};
    if (req.user.role === 'CANDIDATE') filter.candidateId = req.user.id;
    else if (req.user.role === 'EMPLOYER') filter.employerId = req.user.id;
    else return error(res, 'Admins do not have message threads', 403);

    const [threads, total] = await Promise.all([
      MessageThread.find(filter)
        .populate('candidateId', 'firstName lastName avatarUrl')
        .populate('employerId', 'firstName lastName companyName avatarUrl')
        .populate('jobId', 'title')
        .sort({ 'lastMessage.sentAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MessageThread.countDocuments(filter)
    ]);

    // Fetch employer profiles in batch to get actual companyName
    const employerIds = threads.map(t => t.employerId?._id || t.employerId).filter(Boolean);
    const EmployerProfile = require('../models/EmployerProfile');
    const profiles = await EmployerProfile.find({ userId: { $in: employerIds } }).lean();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const mappedThreads = threads.map(t => {
      if (t.employerId) {
        const empId = (t.employerId._id || t.employerId).toString();
        const profile = profileMap.get(empId);
        if (typeof t.employerId === 'object') {
          t.employerId.companyName = profile ? profile.companyName : `${t.employerId.firstName || 'Employer'}'s Company`;
        }
      }
      return t;
    });

    return paginated(res, mappedThreads, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const getThreadMessages = async (req, res, next) => {
  try {
    const thread = await MessageThread.findById(req.params.threadId);
    if (!thread) return error(res, 'Thread not found', 404);

    if (thread.candidateId.toString() !== req.user.id && thread.employerId.toString() !== req.user.id) {
      return error(res, 'Not authorized', 403);
    }

    const { page, limit, skip } = getPaginationParams(req.query);

    const [messages, total] = await Promise.all([
      Message.find({ threadId: thread._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ threadId: thread._id })
    ]);

    // Mark as read
    if (req.user.role === 'CANDIDATE' && thread.unreadCandidate > 0) {
      thread.unreadCandidate = 0;
      await thread.save();
    } else if (req.user.role === 'EMPLOYER' && thread.unreadEmployer > 0) {
      thread.unreadEmployer = 0;
      await thread.save();
    }

    // Return in chronological order (oldest first for chat UI usually, but paginated backwards)
    // Actually we keep it reverse chronological for pagination, frontend can reverse it.
    return paginated(res, messages, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, jobId, content } = req.body;
    let { threadId } = req.body;

    if (!content) return error(res, 'Message content is required', 400);

    let thread;
    if (threadId) {
      thread = await MessageThread.findById(threadId);
      if (!thread) return error(res, 'Thread not found', 404);
    } else {
      if (!receiverId) return error(res, 'Receiver ID required to start a new thread', 400);
      
      const candidateId = req.user.role === 'CANDIDATE' ? req.user.id : receiverId;
      const employerId = req.user.role === 'EMPLOYER' ? req.user.id : receiverId;

      thread = await MessageThread.findOne({ candidateId, employerId });
      if (!thread) {
        thread = await MessageThread.create({ candidateId, employerId, jobId });
      }
    }

    if (thread.candidateId.toString() !== req.user.id && thread.employerId.toString() !== req.user.id) {
      return error(res, 'Not authorized', 403);
    }

    const message = await Message.create({
      threadId: thread._id,
      senderId: req.user.id,
      content
    });

    thread.lastMessage = { content, sentAt: Date.now(), senderId: req.user.id };
    if (req.user.role === 'CANDIDATE') thread.unreadEmployer += 1;
    else thread.unreadCandidate += 1;
    await thread.save();

    // If socket io is attached globally
    if (global.io) {
      const receiverRole = req.user.role === 'CANDIDATE' ? 'EMPLOYER' : 'CANDIDATE';
      const receiverIdToEmit = receiverRole === 'CANDIDATE' ? thread.candidateId : thread.employerId;
      global.io.to(receiverIdToEmit.toString()).emit('newMessage', message);
    }

    return res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
};

module.exports = {
  getMyThreads, getThreadMessages, sendMessage
};
