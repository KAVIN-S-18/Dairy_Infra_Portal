const express = require('express');
const router = express.Router();
const tmController = require('../controllers/transportManagerController');
const { verifyToken, isTransportManager } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isTransportManager);

router.get('/pending-dispatches', tmController.getPendingDispatches);
router.get('/pending-deliveries', tmController.getPendingDeliveries);
router.get('/resources', tmController.getAvailableResources);
router.post('/drivers', tmController.createDriver);
router.put('/drivers/:id', tmController.updateDriver);
router.delete('/drivers/:id', tmController.deleteDriver);
router.post('/motor-vehicles', tmController.createMotorVehicle);
router.put('/motor-vehicles/:id', tmController.updateMotorVehicle);
router.delete('/motor-vehicles/:id', tmController.deleteMotorVehicle);
router.post('/assign-transport', tmController.assignDriverAndVehicle);
router.post('/assign-delivery', tmController.assignDelivery);

module.exports = router;
