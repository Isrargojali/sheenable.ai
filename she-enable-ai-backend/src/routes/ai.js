const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCV } = require('../controllers/aiController');

router.use(protect);
router.post('/generate-cv', generateCV);

module.exports = router;
