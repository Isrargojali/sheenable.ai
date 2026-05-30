const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMentors, bookMentorSession } = require('../controllers/mentorController');

router.get('/', protect, getMentors);
router.post('/:id/book', protect, bookMentorSession);

module.exports = router;


