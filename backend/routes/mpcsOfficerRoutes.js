const express = require('express');
const router = express.Router();
const mpcsOfficerController = require('../controllers/mpcsOfficerController');
const { verifyToken, isMpcsOfficer } = require('../middleware/authMiddleware');

// Protect routes with token and MPCS officer role
router.use(verifyToken);
router.use(isMpcsOfficer);

// Farmer management
router.post('/farmers', mpcsOfficerController.addFarmer);
router.get('/farmers/list/ids', mpcsOfficerController.getFarmersByIds);
router.get('/farmers', mpcsOfficerController.getFarmers);
router.get('/farmers/:farmerId/details', mpcsOfficerController.getFarmerDetails);
router.patch('/farmers/:farmerId/status', mpcsOfficerController.updateFarmerStatus);
router.patch('/farmers/:farmerId/details', mpcsOfficerController.updateFarmerDetails);

// Milk procurement logging
router.post('/milk-procurement', mpcsOfficerController.logMilkProcurement);
router.get('/milk-procurement/summary', mpcsOfficerController.getProcurementSummary);
router.post('/milk-procurement/:procurementId/dispatch', mpcsOfficerController.dispatchProcurement);
router.post('/milk-procurement/dispatch-bulk', mpcsOfficerController.dispatchBulk);
router.post('/milk-procurement/:procurementId/reached-district', mpcsOfficerController.markReachedDistrict);

module.exports = router;
