const express = require('express');
const hierarchyController = require('../controllers/hierarchyController');

const router = express.Router();

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

// Staff Management
router.get('/district-managers/:dmId/staff', hierarchyController.getStaffByDistrictManager);
router.get('/transport-managers/:tmId/staff', hierarchyController.getTransportManagerStaff);
router.get('/all-staff', hierarchyController.getAllStaff);
router.put('/staff/:type/:id', hierarchyController.updateStaff);
router.delete('/staff/:type/:id', hierarchyController.deleteStaff);
router.delete('/transport-staff/:type/:id', hierarchyController.deleteTransportStaff);

module.exports = router;
