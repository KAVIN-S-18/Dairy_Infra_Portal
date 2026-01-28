const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Authenticated admin routes
 */
router.post('/create', verifyToken, userController.createUser);
router.get('/by-admin/:adminId', verifyToken, userController.getUsersByAdmin);
router.put('/:userId', verifyToken, userController.updateUser);
router.delete('/:userId', verifyToken, userController.deleteUser);

module.exports = router;
