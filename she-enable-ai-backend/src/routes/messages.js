const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyThreads, getThreadMessages, sendMessage } = require('../controllers/messageController');

router.use(protect);

router.get('/threads', getMyThreads);
router.get('/threads/:threadId/messages', getThreadMessages);
router.post('/send', sendMessage);

module.exports = router;
