const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { getSalaryStats, createSalaryReport } = require('../controllers/salaryController');

router.get('/', optionalAuth, getSalaryStats);
router.post('/', protect, createSalaryReport);

module.exports = router;

