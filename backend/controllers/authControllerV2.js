const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const Admin = require('../models/Admin');
const DistrictManager = require('../models/DistrictManager');
const Supervisor = require('../models/Supervisor');
const Operator = require('../models/Operator');
const MPCSofficer = require('../models/MPCSofficer');
const Farmer = require('../models/Farmer');

/**
 * Login - supports Super Admin, Admin, District Manager, Supervisor, Operator, MPCS Officer, Farmer
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;
    let role = null;
    let userId = null;
    const normalizePhone = (num) => (String(num || '').replace(/\D/g, '').replace(/^\+?/, ''));

    // Check Super Admin (User table)
    let superAdmin = await User.findOne({ where: { email, role: 'SUPER_ADMIN' } });
    if (superAdmin) {
      const passwordMatch = await bcrypt.compare(password, superAdmin.passwordHash);
      if (passwordMatch) {
        user = superAdmin;
        role = 'SUPER_ADMIN';
        userId = superAdmin.id;
      }
    }

    let additionalInfo = {};

    // Check Transport Manager (User table)
    if (!user) {
      let tm = await User.findOne({ where: { email, role: 'TRANSPORT_MANAGER' } });
      if (tm) {
        const passwordMatch = await bcrypt.compare(password, tm.passwordHash);
        if (passwordMatch && tm.status === 'APPROVED') {
          const tmRecord = await require('../models/TransportManager').findOne({ where: { email } });
          user = tm;
          role = 'TRANSPORT_MANAGER';
          userId = tm.id;
          if (tmRecord) {
            additionalInfo = {
              tmId: tmRecord.tmId,
              tmRecordId: tmRecord.id,
              dmId: tmRecord.dmId,
              dmNumber: tmRecord.dmNumber,
              adminNumber: tmRecord.adminNumber,
            };
          }
        }
      }
    }

    // Check Driver (User table)
    if (!user) {
      let driver = await User.findOne({ where: { email, role: 'DRIVER' } });
      if (driver) {
        const passwordMatch = await bcrypt.compare(password, driver.passwordHash);
        if (passwordMatch && driver.status === 'APPROVED') {
          const driverRecord = await require('../models/Driver').findOne({ where: { email } });
          user = driver;
          role = 'DRIVER';
          userId = driver.id;
          if (driverRecord) {
            additionalInfo = {
              driverRecordId: driverRecord.id,
              driverId: driverRecord.driverId,
              tmId: driverRecord.tmId,
              tmNumber: driverRecord.tmNumber,
              dmNumber: driverRecord.dmNumber,
            };
          }
        }
      }
    }

    // Check Admin table
    if (!user) {
      let admin = await Admin.findOne({ where: { email } });
      if (admin) {
        const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
        if (passwordMatch) {
          user = admin;
          role = 'ADMIN';
          userId = admin.id;
        }
      }
    }

    // Check District Manager table
    if (!user) {
      let dm = await DistrictManager.findOne({ where: { email } });
      if (dm) {
        const passwordMatch = await bcrypt.compare(password, dm.passwordHash);
        if (passwordMatch) {
          user = dm;
          role = 'DISTRICT_MANAGER';
          userId = dm.id;
        }
      }
    }

    // Check Supervisor table
    if (!user) {
      let sup = await Supervisor.findOne({ where: { email } });
      if (sup) {
        const passwordMatch = await bcrypt.compare(password, sup.passwordHash);
        if (passwordMatch) {
          user = sup;
          role = 'SUPERVISOR';
          userId = sup.id;
        }
      }
    }

    // Check Operator table
    if (!user) {
      let op = await Operator.findOne({ where: { email } });
      if (op) {
        const passwordMatch = await bcrypt.compare(password, op.passwordHash);
        if (passwordMatch) {
          user = op;
          role = 'OPERATOR';
          userId = op.id;
        }
      }
    }

    // Check MPCS Officer table
    if (!user) {
      let mpcs = await MPCSofficer.findOne({ where: { email } });
      if (mpcs) {
        const passwordMatch = await bcrypt.compare(password, mpcs.passwordHash);
        if (passwordMatch) {
          user = mpcs;
          role = 'MPCS_OFFICER';
          userId = mpcs.id;
        }
      }
    }

    // Check Farmer table
    if (!user) {
      const cleanedPhone = normalizePhone(email);
      const candidatePhones = new Set([cleanedPhone]);
      if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
        candidatePhones.add(cleanedPhone.slice(2));
      } else if (cleanedPhone.length === 10) {
        candidatePhones.add('91' + cleanedPhone);
      }

      let farmer = await Farmer.findOne({ where: { phoneNumber: { [Op.in]: Array.from(candidatePhones) } } });
      if (farmer) {
        if (farmer.status !== 'ACTIVE') {
          return res.status(403).json({ error: 'Your account is inactive' });
        }

        // Farmers use dateOfBirth as password in DDMMYYYY format
        if (farmer.dateOfBirth) {
          const dob = new Date(farmer.dateOfBirth);
          const day = String(dob.getDate()).padStart(2, '0');
          const month = String(dob.getMonth() + 1).padStart(2, '0');
          const year = dob.getFullYear();
          const dobString = `${day}${month}${year}`; // DDMMYYYY

          if (password === dobString) {
            user = farmer;
            role = 'FARMER';
            userId = farmer.id;
          } else {
            // Also check UTC to be safe
            const uDay = String(dob.getUTCDate()).padStart(2, '0');
            const uMonth = String(dob.getUTCMonth() + 1).padStart(2, '0');
            const uYear = dob.getUTCFullYear();
            const uDobString = `${uDay}${uMonth}${uYear}`;

            if (password === uDobString) {
              user = farmer;
              role = 'FARMER';
              userId = farmer.id;
            } else {
              return res.status(401).json({ error: 'Invalid credentials' });
            }
          }
        } else {
          return res.status(401).json({ error: 'Farmer account not properly configured' });
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active (for non-Super Admin)
    if (role !== 'SUPER_ADMIN' && user.status && user.status !== 'ACTIVE' && user.status !== 'APPROVED') {
      return res.status(403).json({ error: `Your account is ${user.status.toLowerCase()}` });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email: user.email, role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' }
    );

    // Prepare user response based on role
    let userResponse = {
      id: userId,
      email: user.email,
      role,
    };

    if (role === 'SUPER_ADMIN') {
      userResponse.fullName = user.fullName;
    } else if (role === 'ADMIN') {
      userResponse.adminId = user.adminId;
      userResponse.fullName = user.fullName;
      userResponse.organizationName = user.organizationName;
    } else if (role === 'DISTRICT_MANAGER') {
      userResponse.dmId = user.dmId;
      userResponse.fullName = user.fullName;
      userResponse.adminNumber = user.adminNumber;
    } else if (role === 'TRANSPORT_MANAGER') {
      userResponse.tmId = additionalInfo.tmId || user.tmId || null;
      userResponse.tmRecordId = additionalInfo.tmRecordId || null;
      userResponse.dmId = additionalInfo.dmId || null;
      userResponse.dmNumber = additionalInfo.dmNumber || null;
      userResponse.adminNumber = additionalInfo.adminNumber || null;
      userResponse.fullName = user.fullName;
    } else if (role === 'DRIVER') {
      userResponse.driverId = additionalInfo.driverId || null;
      userResponse.driverRecordId = additionalInfo.driverRecordId || null;
      // `tmId` for dashboard routing expects the TM code (tmNumber), not TM internal db id
      userResponse.tmId = additionalInfo.tmNumber || additionalInfo.tmId || null;
      userResponse.tmNumber = additionalInfo.tmNumber || null;
      userResponse.dmNumber = additionalInfo.dmNumber || null;
      userResponse.fullName = user.fullName;
    } else if (['SUPERVISOR', 'OPERATOR', 'MPCS_OFFICER'].includes(role)) {
      if (role === 'SUPERVISOR') {
        userResponse.supId = user.supId;
        userResponse.specialization = user.specialization;
      }
      if (role === 'OPERATOR') userResponse.opId = user.opId;
      if (role === 'MPCS_OFFICER') userResponse.mpcsId = user.mpcsId;
      userResponse.fullName = user.fullName;
      userResponse.adminNumber = user.adminNumber;
      userResponse.dmNumber = user.dmNumber;
    }

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const { userId, role } = req.user;

    let user = null;

    switch (role) {
      case 'SUPER_ADMIN':
        user = await User.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
        break;
      case 'ADMIN':
        user = await Admin.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
        break;
      case 'DISTRICT_MANAGER':
        user = await DistrictManager.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
        break;
      case 'SUPERVISOR':
        user = await Supervisor.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
        break;
      case 'OPERATOR':
        user = await Operator.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
        break;
      case 'MPCS_OFFICER':
        user = await MPCSofficer.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
        break;
      default:
        return res.status(400).json({ error: 'Invalid role' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * Get pending admin registrations (Super Admin only)
 */
exports.getPendingAdmins = async (req, res) => {
  try {
    const pendingAdmins = await Admin.findAll({
      where: { status: 'PENDING' },
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

    const admin = await Admin.findByPk(adminId);
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
 * Get all approved admins (for super admin dashboard)
 */
exports.getApprovedAdmins = async (req, res) => {
  try {
    const approvedAdmins = await Admin.findAll({
      where: { status: 'APPROVED' },
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
 * Specific Farmer Login using phone number (for /farmer-login endpoint)
 */
exports.farmerLogin = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }

    const normalizePhone = (num) => (String(num || '').replace(/\D/g, '').replace(/^\+?/, ''));
    const cleanedPhone = normalizePhone(phoneNumber);
    const candidatePhones = new Set([cleanedPhone]);
    if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
      candidatePhones.add(cleanedPhone.slice(2));
    } else if (cleanedPhone.length === 10) {
      candidatePhones.add('91' + cleanedPhone);
    }

    const farmer = await Farmer.findOne({ where: { phoneNumber: { [Op.in]: Array.from(candidatePhones) } } });
    if (!farmer) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    if (farmer.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account is inactive' });
    }

    let validPassword = false;
    if (farmer.dateOfBirth) {
      const dob = new Date(farmer.dateOfBirth);

      // Try local date
      const day = String(dob.getDate()).padStart(2, '0');
      const month = String(dob.getMonth() + 1).padStart(2, '0');
      const year = dob.getFullYear();
      const dobString = `${day}${month}${year}`;

      // Try UTC date
      const uDay = String(dob.getUTCDate()).padStart(2, '0');
      const uMonth = String(dob.getUTCMonth() + 1).padStart(2, '0');
      const uYear = dob.getUTCFullYear();
      const uDobString = `${uDay}${uMonth}${uYear}`;

      if (password === dobString || password === uDobString) {
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
