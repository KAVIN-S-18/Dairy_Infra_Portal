const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const { verifyToken, isSupervisor } = require('../middleware/authMiddleware');

// Protect routes with token and supervisor role
router.use(verifyToken);
router.use(isSupervisor);

// Work assignment and batch management
router.post('/work-assignments', supervisorController.createBatchAndAssignWork);
router.get('/work-assignments', supervisorController.getWorkAssignments);
router.patch('/work-assignments/:workId', supervisorController.updateWorkStatus);
router.patch('/work-assignments/:workId/machine-control', supervisorController.updateMachineControl);

// Progress summary
router.get('/progress-summary', supervisorController.getProgressSummary);

module.exports = router;
