const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { scheduleInterview, getMyInterviews, getInterviewById, updateInterview, cancelInterview } = require('../controllers/interviewController');

router.use(protect);

router.post('/', authorize('EMPLOYER'), scheduleInterview);
router.get('/', getMyInterviews);
router.get('/:id', getInterviewById);
router.patch('/:id', authorize('EMPLOYER'), updateInterview);
router.post('/:id/cancel', cancelInterview); // Both candidate and employer can cancel

module.exports = router;
