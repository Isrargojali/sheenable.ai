const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCV, getMatchedCandidates, searchCandidates, improveJob, handleSendgridWebhook } = require('../controllers/aiController');

// Expose SendGrid webhook BEFORE auth protection to accept Twilio server dispatches
router.post('/webhooks/sendgrid', handleSendgridWebhook);

router.use(protect);
router.post('/cv-builder', generateCV);
router.get('/matched-candidates', getMatchedCandidates);
router.get('/search-candidates', searchCandidates);
router.post('/improve-job', improveJob);

module.exports = router;
