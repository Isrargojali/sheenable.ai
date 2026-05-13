const Notification = require('../models/Notification');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPaginationParams, getPaginationData } = require('../utils/paginate');

const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user.id })
    ]);

    return paginated(res, notifications, getPaginationData(total, page, limit));
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return error(res, 'Notification not found', 404);

    if (notification.userId.toString() !== req.user.id) return error(res, 'Not authorized', 403);

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();

    return success(res, notification);
  } catch (err) { next(err); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: Date.now() } }
    );
    return success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

module.exports = {
  getMyNotifications, markAsRead, markAllAsRead
};
