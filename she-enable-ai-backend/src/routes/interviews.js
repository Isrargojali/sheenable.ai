const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  cancelInterview,
  interviewValidation,
} = require('../controllers/interviewController');

router.get('/',              protect, getInterviews);
router.get('/:id',           protect, getInterviewById);
router.post('/',             protect, authorizeRoles('EMPLOYER'), ...interviewValidation, scheduleInterview);
router.put('/:id',           protect, authorizeRoles('EMPLOYER'), updateInterview);
router.post('/:id/cancel',   protect, cancelInterview);  // Both candidate and employer can cancel

module.exports = router;
