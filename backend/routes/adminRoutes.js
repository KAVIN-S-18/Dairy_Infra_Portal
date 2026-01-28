const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Protect all routes with token and admin role
router.use(verifyToken);
router.use(isAdmin);

// District Manager Management
router.post('/district-managers', adminController.createDistrictManager);
router.get('/district-managers', adminController.getDistrictManagers);

// Staff Member Management (Supervisor, Operator, MPCS Officer)
router.post('/staff/supervisor', adminController.createStaffMember); // Create Supervisor
router.post('/staff/operator', adminController.createStaffMember);   // Create Operator
router.post('/staff/mpcs-officer', adminController.createMpcsOfficer); // Create MPCS Officer

// Get staff under district manager
router.get('/district-managers/:districtManagerId/staff', adminController.getStaffByDistrictManager);

// Get all staff under admin
router.get('/staff', adminController.getAllStaff);

// Update and delete staff
router.put('/staff/:staffId', adminController.updateStaffMember);
router.delete('/staff/:staffId', adminController.deleteStaffMember);

module.exports = router;
