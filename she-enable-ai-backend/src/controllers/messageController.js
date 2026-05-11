const Thread = require('../models/Thread');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getThreadFilter = (user) => {
  if (user.role === 'CANDIDATE') return { candidateId: user._id, deletedByCandidate: false };
  if (user.role === 'EMPLOYER') return { employerId: user._id, deletedByEmployer: false };
  return {};
};

const isParticipant = (thread, userId) =>
  thread.candidateId.toString() === userId.toString() || thread.employerId.toString() === userId.toString();

const getThreads = async (req, res, next) => {
  try {
    const filter = getThreadFilter(req.user);
    const threads = await Thread.find(filter).populate('candidateId', 'firstName lastName avatarUrl').populate('employerId', 'firstName lastName avatarUrl').populate('jobId', 'title').sort({ lastMessageAt: -1 }).lean();
    const enriched = threads.map(thread => {
      const unreadCount = req.user.role === 'CANDIDATE' ? thread.unreadCandidate : thread.unreadEmployer;
      const otherPerson = req.user.role === 'CANDIDATE' ? thread.employerId : thread.candidateId;
      return { ...thread, otherPerson, unreadCount, unreadCandidate: undefined, unreadEmployer: undefined };
    });
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) { next(err); }
};

const getMessages = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found.' });
    if (!isParticipant(thread, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied.' });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    const total = await Message.countDocuments({ threadId: req.params.threadId });
    const messages = await Message.find({ threadId: req.params.threadId }).populate('senderId', 'firstName lastName avatarUrl role').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    await Message.updateMany({ threadId: req.params.threadId, senderId: { $ne: req.user._id }, isRead: false }, { isRead: true, readAt: new Date() });
    const unreadField = req.user.role === 'CANDIDATE' ? 'unreadCandidate' : 'unreadEmployer';
    await Thread.findByIdAndUpdate(req.params.threadId, { [unreadField]: 0 });
    const io = req.app.get('io');
    if (io) {
      const otherUserId = req.user.role === 'CANDIDATE' ? thread.employerId.toString() : thread.candidateId.toString();
      io.to(otherUserId).emit('messages-read', { threadId: req.params.threadId, readBy: req.user._id });
    }
    res.json({ success: true, total, totalPages: Math.ceil(total / limit), currentPage: page, hasMore: page * limit < total, data: messages.reverse() });
  } catch (err) { next(err); }
};

const createThread = async (req, res, next) => {
  try {
    const { recipientId, jobId, initialMessage } = req.body;
    if (!recipientId) return res.status(400).json({ success: false, message: 'recipientId is required.' });
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found.' });
    let candidateId, employerId;
    if (req.user.role === 'CANDIDATE' && recipient.role === 'EMPLOYER') { candidateId = req.user._id; employerId = recipient._id; }
    else if (req.user.role === 'EMPLOYER' && recipient.role === 'CANDIDATE') { candidateId = recipient._id; employerId = req.user._id; }
    else return res.status(400).json({ success: false, message: 'Messaging only allowed between candidates and employers.' });
    let thread = await Thread.findOne({ candidateId, employerId });
    if (!thread) thread = await Thread.create({ candidateId, employerId, jobId: jobId || null });
    if (initialMessage?.trim()) {
      await Message.create({ threadId: thread._id, senderId: req.user._id, content: initialMessage.trim() });
      const unreadField = req.user.role === 'CANDIDATE' ? 'unreadEmployer' : 'unreadCandidate';
      await Thread.findByIdAndUpdate(thread._id, { lastMessage: initialMessage.trim().substring(0, 100), lastMessageAt: new Date(), lastSenderId: req.user._id, $inc: { [unreadField]: 1 } });
      await Notification.create({ userId: recipientId, type: 'MESSAGE', title: `New message from ${req.user.firstName}`, body: initialMessage.substring(0, 80), relatedId: thread._id, relatedType: 'Thread' });
      const io = req.app.get('io');
      if (io) io.to(recipientId.toString()).emit('new-message', { threadId: thread._id, senderId: req.user._id, content: initialMessage });
    }
    const populated = await Thread.findById(thread._id).populate('candidateId', 'firstName lastName avatarUrl').populate('employerId', 'firstName lastName avatarUrl').populate('jobId', 'title');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Message content is required.' });
    const thread = await Thread.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found.' });
    if (!isParticipant(thread, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied.' });
    const message = await Message.create({ threadId: thread._id, senderId: req.user._id, content: content.trim() });
    const isCandidate = req.user.role === 'CANDIDATE';
    const recipientId = isCandidate ? thread.employerId.toString() : thread.candidateId.toString();
    const unreadField = isCandidate ? 'unreadEmployer' : 'unreadCandidate';
    await Thread.findByIdAndUpdate(thread._id, { lastMessage: content.trim().substring(0, 100), lastMessageAt: new Date(), lastSenderId: req.user._id, $inc: { [unreadField]: 1 } });
    await Notification.create({ userId: recipientId, type: 'MESSAGE', title: `${req.user.firstName} sent you a message`, body: content.substring(0, 80), relatedId: thread._id, relatedType: 'Thread' });
    const io = req.app.get('io');
    if (io) { io.to(recipientId).emit('new-message', { threadId: thread._id, messageId: message._id, senderId: req.user._id, content: content.trim(), createdAt: message.createdAt }); io.to(recipientId).emit('unread-update', { threadId: thread._id }); }
    const populated = await Message.findById(message._id).populate('senderId', 'firstName lastName avatarUrl role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

const markThreadRead = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found.' });
    if (!isParticipant(thread, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied.' });
    const unreadField = req.user.role === 'CANDIDATE' ? 'unreadCandidate' : 'unreadEmployer';
    await Thread.findByIdAndUpdate(thread._id, { [unreadField]: 0 });
    await Message.updateMany({ threadId: thread._id, senderId: { $ne: req.user._id }, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Thread marked as read.' });
  } catch (err) { next(err); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const field = req.user.role === 'CANDIDATE' ? 'unreadCandidate' : 'unreadEmployer';
    const filter = getThreadFilter(req.user);
    const threads = await Thread.find(filter).select(field);
    const total = threads.reduce((sum, t) => sum + (t[field] || 0), 0);
    res.json({ success: true, unreadCount: total });
  } catch (err) { next(err); }
};

const deleteThread = async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found.' });
    if (!isParticipant(thread, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied.' });
    const field = req.user.role === 'CANDIDATE' ? 'deletedByCandidate' : 'deletedByEmployer';
    await Thread.findByIdAndUpdate(thread._id, { [field]: true });
    res.json({ success: true, message: 'Conversation removed from your inbox.' });
  } catch (err) { next(err); }
};

module.exports = { getThreads, getMessages, createThread, sendMessage, markThreadRead, getUnreadCount, deleteThread };

