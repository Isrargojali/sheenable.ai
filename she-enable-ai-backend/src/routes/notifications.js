const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { isMongoConnected } = require('../config/database');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.get('/',             protect, getNotifications);
router.put('/read-all',     protect, markAllRead);

// Unread count — GET /notifications/unread-count
router.get('/unread-count', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.json({ success: true, unreadCount: 0 });
    const Notification = require('../models/Notification');
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, unreadCount });
  } catch (err) { next(err); }
});

// Delete single notification — DELETE /notifications/:id
router.delete('/:id',       protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.json({ success: true });
    const Notification = require('../models/Notification');
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) { next(err); }
});

router.put('/:id/read',     protect, markRead);

module.exports = router;
