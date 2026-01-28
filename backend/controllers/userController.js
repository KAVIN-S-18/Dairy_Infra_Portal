const User = require('../models/User');

/**
 * Create a new user (by admin)
 */
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, password, role, adminId } = req.body;

        // Validate input
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Find admin to get organization details
        const admin = await User.findByPk(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Hash password
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            fullName,
            email,
            passwordHash,
            role,
            organizationName: admin.organizationName,
            organizationType: admin.organizationType,
            status: 'APPROVED',
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

/**
 * Get all users under an admin
 */
exports.getUsersByAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Get admin to get organization details
        const admin = await User.findByPk(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Get all users with same organization
        const users = await User.findAll({
            where: {
                organizationName: admin.organizationName,
                role: ['FARMER', 'SUPERVISOR', 'OPERATOR', 'MPCS_OFFICER'],
            },
            attributes: { exclude: ['passwordHash'] },
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Update user details
 */
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, role, status } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (fullName) user.fullName = fullName;
        if (role) user.role = role;
        if (status) user.status = status;

        await user.save();

        return res.status(200).json({
            message: 'User updated successfully',
            user,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

/**
 * Delete a user
 */
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.destroy();

        return res.status(200).json({
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
