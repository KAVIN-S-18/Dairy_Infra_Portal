const express = require('express');
const hierarchyController = require('../controllers/hierarchyController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `machine-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Machine Management (Protected)
router.post('/machines', verifyToken, hierarchyController.createMachine);
router.get('/machines', verifyToken, hierarchyController.getMachines);
router.patch('/machines/:id', verifyToken, hierarchyController.updateMachine);
router.delete('/machines/:id', verifyToken, hierarchyController.deleteMachine);

router.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ success: true, url: `http://localhost:5000/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ success: false, message: 'No file uploaded' });
  }
});

// Admin Management
router.post('/admins', hierarchyController.createAdmin);
router.get('/admins', hierarchyController.getAllAdmins);

// District Manager Management
router.post('/district-managers', hierarchyController.createDistrictManager);
router.get('/admins/:adminId/district-managers', hierarchyController.getDistrictManagersByAdmin);

// Supervisor Management
router.post('/supervisors', hierarchyController.createSupervisor);

// Operator Management
router.post('/operators', hierarchyController.createOperator);

// MPCS Officer Management
router.post('/mpcs-officers', hierarchyController.createMPCSofficer);

// Transport Manager Management
router.post('/transport-managers', hierarchyController.createTransportManager);
router.get('/district-managers/:dmId/transport-managers', hierarchyController.getTransportManagersByDistrictManager);

// Driver Management
router.post('/drivers', hierarchyController.createDriver);
router.get('/transport-managers/:tmId/drivers', hierarchyController.getDriversByTransportManager);

// Motor Vehicle Management
router.post('/motor-vehicles', hierarchyController.createMotorVehicle);
router.get('/transport-managers/:tmId/vehicles', hierarchyController.getVehiclesByTransportManager);

// Trip Management
router.post('/trips', hierarchyController.createTrip);
router.get('/transport-managers/:tmId/trips', hierarchyController.getTripsByTransportManager);
router.get('/transport-managers/:tmId/dispatches', hierarchyController.getDispatchesByTransportManager);
router.get('/drivers/:driverId/trips', hierarchyController.getTripsByDriver);
router.put('/trips/:tripId', hierarchyController.updateTrip);

// Chiller Tank Management (Protected)
router.post('/chiller-tanks', verifyToken, hierarchyController.createChillerTank);
router.get('/chiller-tanks', verifyToken, hierarchyController.getChillerTanks);
router.patch('/chiller-tanks/:id', verifyToken, hierarchyController.updateChillerTank);
router.delete('/chiller-tanks/:id', verifyToken, hierarchyController.deleteChillerTank);

// Logistics & Operations
router.get('/logistics-log', verifyToken, hierarchyController.getMPCSDispatches);
router.post('/delivery-requests', verifyToken, hierarchyController.createDeliveryRequest);
router.get('/delivery-requests', verifyToken, hierarchyController.getDeliveryRequests);
router.delete('/transport-staff/:type/:id', hierarchyController.deleteTransportStaff);

// Staff Management
router.get('/district-managers/:dmId/staff', hierarchyController.getStaffByDistrictManager);
router.get('/transport-managers/:tmId/staff', hierarchyController.getTransportManagerStaff);
router.get('/all-staff', hierarchyController.getAllStaff);
router.put('/staff/:type/:id', hierarchyController.updateStaff);
router.delete('/staff/:type/:id', hierarchyController.deleteStaff);

module.exports = router;
