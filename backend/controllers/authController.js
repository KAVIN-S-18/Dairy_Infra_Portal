const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Register a new admin (Cooperative or Private)
 */
exports.registerAdmin = async (req, res) => {
    try {
        const { fullName, email, password, organizationName, organizationType } = req.body;

        // Validate input
        if (!fullName || !email || !password || !organizationName || !organizationType) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Determine role based on organization type
        const role = organizationType === 'cooperative' ? 'COOPERATIVE_ADMIN' : 'PRIVATE_ADMIN';

        // Create new admin (status will be PENDING by default)
        const newAdmin = await User.create({
            fullName,
            email,
            passwordHash,
            role,
            organizationName,
            organizationType: organizationType.toUpperCase(),
            status: 'PENDING',
        });

        return res.status(201).json({
            message: 'Admin registration successful. Awaiting approval from super admin.',
            adminId: newAdmin.id,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

const fs = require('fs');
const path = require('path');

/**
 * Login - only approved admins can login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const logFile = path.join(__dirname, '../login-debug.log');
        const log = `[${new Date().toISOString()}] Login attempt: email=${email}, password length=${password?.length}\n`;
        fs.appendFileSync(logFile, log);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            fs.appendFileSync(logFile, `User not found for ${email}\n`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        fs.appendFileSync(logFile, `User found: ${user.email}, status=${user.status}\n`);

        // Check if user is approved
        if (user.status !== 'APPROVED') {
            fs.appendFileSync(logFile, `User not approved: ${user.status}\n`);
            return res.status(403).json({ error: `Your account is ${user.status.toLowerCase()}. Please wait for admin approval.` });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        fs.appendFileSync(logFile, `Password match: ${passwordMatch}, hash exists: ${!!user.passwordHash}\n`);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                organizationName: user.organizationName,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Get pending admin registrations (Super Admin only)
 */
exports.getPendingAdmins = async (req, res) => {
    try {
        const pendingAdmins = await User.findAll({
            where: { status: 'PENDING', role: ['COOPERATIVE_ADMIN', 'PRIVATE_ADMIN'] },
            attributes: { exclude: ['passwordHash'] },
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json(pendingAdmins);
    } catch (error) {
        console.error('Error fetching pending admins:', error);
        res.status(500).json({ error: 'Failed to fetch pending admins' });
    }
};

/**
 * Approve an admin (Super Admin only)
 */
exports.approveAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        const admin = await User.findByPk(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (admin.status === 'APPROVED') {
            return res.status(400).json({ error: 'Admin is already approved' });
        }

        admin.status = 'APPROVED';
        admin.approvedAt = new Date();
        await admin.save();

        return res.status(200).json({
            message: 'Admin approved successfully',
            admin,
        });
    } catch (error) {
        console.error('Error approving admin:', error);
        res.status(500).json({ error: 'Failed to approve admin' });
    }
};

/**
 * Reject an admin (Super Admin only)
 */
exports.rejectAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { reason } = req.body;

        const admin = await User.findByPk(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (admin.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending admins can be rejected' });
        }

        admin.status = 'REJECTED';
        await admin.save();

        return res.status(200).json({
            message: 'Admin rejected successfully',
            admin,
        });
    } catch (error) {
        console.error('Error rejecting admin:', error);
        res.status(500).json({ error: 'Failed to reject admin' });
    }
};

/**
 * Get all approved admins (for super admin dashboard)
 */
exports.getApprovedAdmins = async (req, res) => {
    try {
        const approvedAdmins = await User.findAll({
            where: { status: 'APPROVED', role: ['COOPERATIVE_ADMIN', 'PRIVATE_ADMIN'] },
            attributes: { exclude: ['passwordHash'] },
            order: [['approvedAt', 'DESC']],
        });

        return res.status(200).json(approvedAdmins);
    } catch (error) {
        console.error('Error fetching approved admins:', error);
        res.status(500).json({ error: 'Failed to fetch approved admins' });
    }
};

/**
 * Farmer Login using phone number
 */
exports.farmerLogin = async (req, res) => {
    try {
        const Farmer = require('../models/Farmer');
        const { phoneNumber, password } = req.body;

        if (!phoneNumber || !password) {
            return res.status(400).json({ error: 'Phone number and password are required' });
        }

        // Find farmer by phone number
        const farmer = await Farmer.findOne({ where: { phoneNumber } });
        if (!farmer) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        // Check if farmer is active
        if (farmer.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Your account is inactive. Please contact your MPCS Officer.' });
        }

        // Generate default password from date of birth if farmer has one
        let validPassword = false;
        
        if (farmer.dateOfBirth) {
            // Format: DDMMYYYY
            const dob = new Date(farmer.dateOfBirth);
            const day = String(dob.getDate()).padStart(2, '0');
            const month = String(dob.getMonth() + 1).padStart(2, '0');
            const year = dob.getFullYear();
            const defaultPassword = `${day}${month}${year}`;
            
            if (password === defaultPassword) {
                validPassword = true;
            }
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: farmer.id, phoneNumber: farmer.phoneNumber, role: 'FARMER', farmerId: farmer.farmerId },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            message: 'Farmer login successful',
            token,
            user: {
                id: farmer.id,
                fullName: farmer.fullName,
                phoneNumber: farmer.phoneNumber,
                email: farmer.email,
                role: 'FARMER',
                farmerId: farmer.farmerId,
                mpcsOfficerId: farmer.mpcsOfficerId,
            },
        });
    } catch (error) {
        console.error('Farmer login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
