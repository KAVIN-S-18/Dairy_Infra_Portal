const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { verifyToken, isDriver } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isDriver);

router.get('/trips', driverController.getMyTrips);
router.post('/pickup', driverController.markPickedUp);
router.post('/complete', driverController.markReachedDistrict);

module.exports = router;
