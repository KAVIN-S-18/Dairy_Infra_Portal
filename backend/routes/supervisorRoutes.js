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

// Collection tasks for supervisors
router.get('/collection-tasks', supervisorController.getCollectionTasks);
router.get('/chiller-tanks', supervisorController.getChillerTanks);
router.patch('/collection-tasks/:procurementId/collect', supervisorController.collectMilk);
router.patch('/collection-tasks/:procurementId/complete', supervisorController.completeMilk);

// Progress summary
router.get('/progress-summary', supervisorController.getProgressSummary);
router.get('/operators', supervisorController.getMyOperators);

module.exports = router;
