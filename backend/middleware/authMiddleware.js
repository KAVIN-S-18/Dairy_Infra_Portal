const jwt = require('jsonwebtoken');

/**
 * Verify JWT token
 */
exports.verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Check if user is Super Admin
 */
exports.isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Only Super Admin can access this resource' });
    }
    next();
};

/**
 * Check if user is Admin
 */
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only Admins can access this resource' });
    }
    next();
};

/**
 * Check if user is MPCS Officer
 */
exports.isMpcsOfficer = (req, res, next) => {
    if (req.user.role !== 'MPCS_OFFICER') {
        return res.status(403).json({ error: 'Only MPCS Officers can access this resource' });
    }
    next();
};

/**
 * Check if user is Supervisor
 */
exports.isSupervisor = (req, res, next) => {
    if (req.user.role !== 'SUPERVISOR') {
        return res.status(403).json({ error: 'Only Supervisors can access this resource' });
    }
    next();
};

/**
 * Check if user is Operator
 */
exports.isOperator = (req, res, next) => {
    if (req.user.role !== 'OPERATOR') {
        return res.status(403).json({ error: 'Only Operators can access this resource' });
    }
    next();
};

/**
 * Check if user is Farmer
 */
exports.isFarmer = (req, res, next) => {
    if (req.user.role !== 'FARMER') {
        return res.status(403).json({ error: 'Only Farmers can access this resource' });
    }
    next();
};
