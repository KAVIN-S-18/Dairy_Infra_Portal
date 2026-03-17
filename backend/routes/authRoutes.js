const express = require('express');
const authController = require('../controllers/authControllerV2');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Public routesy
 */
router.post('/login', authController.login);
router.post('/farmer-login', authController.farmerLogin);

/**
 * Protected routes
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * Super Admin only routes
 */
router.get('/pending-admins', verifyToken, isSuperAdmin, authController.getPendingAdmins);
router.get('/approved-admins', verifyToken, isSuperAdmin, authController.getApprovedAdmins);
router.put('/approve-admin/:adminId', verifyToken, isSuperAdmin, authController.approveAdmin);

module.exports = router;
