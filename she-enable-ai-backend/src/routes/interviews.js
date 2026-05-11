const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const {
  scheduleInterview,
  getInterviews,
  updateInterview,
  cancelInterview,
  interviewValidation,
} = require('../controllers/interviewController');

// Any authenticated user can view their own interviews
router.get('/', protect, getInterviews);

// Only employers can schedule / update interviews
// FIX: spread interviewValidation array — Express does not accept arrays directly in use()
router.post('/',             protect, authorizeRoles('EMPLOYER'), ...interviewValidation, scheduleInterview);
router.put('/:id',           protect, authorizeRoles('EMPLOYER'), updateInterview);
router.delete('/:id/cancel', protect, cancelInterview); // both candidate and employer can cancel

module.exports = router;
