const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getThreads, getMessages, createThread, sendMessage, markThreadRead, getUnreadCount, deleteThread } = require('../controllers/messageController');

router.get('/unread-count', protect, getUnreadCount);
router.get('/threads', protect, getThreads);
router.post('/threads', protect, createThread);
router.get('/threads/:threadId', protect, getMessages);
router.post('/threads/:threadId', protect, sendMessage);
router.put('/threads/:threadId/read', protect, markThreadRead);
router.delete('/threads/:threadId', protect, deleteThread);

module.exports = router;
