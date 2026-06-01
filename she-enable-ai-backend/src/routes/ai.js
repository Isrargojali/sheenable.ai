const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCV, getMatchedCandidates, searchCandidates, improveJob } = require('../controllers/aiController');

router.use(protect);
router.post('/cv-builder', generateCV);
router.get('/matched-candidates', getMatchedCandidates);
router.get('/search-candidates', searchCandidates);
router.post('/improve-job', improveJob);

module.exports = router;
