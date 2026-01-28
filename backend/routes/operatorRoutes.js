const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { verifyToken, isOperator } = require('../middleware/authMiddleware');

// Protect routes with token and operator role
router.use(verifyToken);
router.use(isOperator);

// Work viewing
router.get('/assigned-work', operatorController.getAssignedWork);
router.get('/todays-work', operatorController.getTodaysWork);

// Work logging
router.post('/work-assignments/:workAssignmentId/completion', operatorController.logWorkCompletion);
router.get('/daily-logs', operatorController.getDailyLogs);

// Summary
router.get('/work-summary', operatorController.getWorkSummary);

module.exports = router;
