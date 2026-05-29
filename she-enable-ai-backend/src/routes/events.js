const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { getEvents, registerForEvent } = require('../controllers/eventController');

router.get('/', optionalAuth, getEvents);
router.post('/:id/register', protect, registerForEvent);

module.exports = router;
