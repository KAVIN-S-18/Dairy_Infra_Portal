const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const { verifyToken, isFarmer } = require('../middleware/authMiddleware');

// Protect routes with token and farmer role
router.use(verifyToken);
router.use(isFarmer);

// Milk production logging and sales
router.post('/milk-logs', farmerController.logMilkProduction);
router.get('/milk-sales', farmerController.getMilkSalesList);
router.get('/milk-sales/summary', farmerController.getMilkSalesSummary);

// Infrastructure management
router.post('/infrastructure', farmerController.addInfrastructure);
router.get('/infrastructure', farmerController.getInfrastructure);
router.patch('/infrastructure/:infrastructureId', farmerController.updateInfrastructureMaintenance);

// Farmer profile and details
router.get('/profile', farmerController.getFarmerProfile);
router.patch('/cattle-details', farmerController.updateCattleDetails);
router.patch('/land-details', farmerController.updateLandDetails);

module.exports = router;
