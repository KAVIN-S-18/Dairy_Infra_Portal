const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * Generate hierarchical ID for District Manager
 * Format: DIST-1, DIST-2, etc.
 */
const generateDistrictManagerId = async (adminId) => {
  try {
    // Count existing district managers under this admin
    const dmCount = await User.count({
      where: { role: 'DISTRICT_MANAGER', adminId, hierarchyCode: { [require('sequelize').Op.not]: null } }
    });

    const hierarchyCode = `DIST-${dmCount + 1}`;
    const districtCode = hierarchyCode; // For DM, hierarchy code is the district code
    
    return { hierarchyCode, districtCode };
  } catch (error) {
    console.error('Error generating DM ID:', error);
    throw error;
  }
};

/**
 * Generate hierarchical ID for Supervisor, Operator, MPCS Officer
 * Format: DIST-1-SUP-1, DIST-1-OP-1, DIST-1-MPCS-1, etc.
 */
const generateStaffId = async (districtManagerId, role) => {
  try {
    const dm = await User.findByPk(districtManagerId);
    if (!dm || dm.role !== 'DISTRICT_MANAGER') {
      throw new Error('Invalid district manager');
    }

    const districtCode = dm.districtCode;
    const rolePrefix = role === 'SUPERVISOR' ? 'SUP' : role === 'OPERATOR' ? 'OP' : 'MPCS';

    // Count existing staff of this role under this district manager
    const staffCount = await User.count({
      where: { role, districtManagerId }
    });

    const hierarchyCode = `${districtCode}-${rolePrefix}-${staffCount + 1}`;
    
    return hierarchyCode;
  } catch (error) {
    console.error('Error generating staff ID:', error);
    throw error;
  }
};

/**
 * Admin creates a district manager
 */
exports.createDistrictManager = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate hierarchical ID
    const { hierarchyCode, districtCode } = await generateDistrictManagerId(adminId);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create district manager
    const dm = await User.create({
      fullName,
      email,
      passwordHash,
      role: 'DISTRICT_MANAGER',
      status: 'APPROVED',
      adminId,
      hierarchyCode,
      districtCode,
    });

    res.status(201).json({
      success: true,
      message: 'District Manager created successfully',
      data: {
        id: dm.id,
        fullName: dm.fullName,
        email: dm.email,
        hierarchyCode: dm.hierarchyCode,
        districtCode: dm.districtCode,
      },
    });
  } catch (error) {
    console.error('Error creating district manager:', error);
    res.status(500).json({ error: 'Failed to create district manager' });
  }
};

/**
 * Admin creates Supervisor/Operator under a District Manager
 */
exports.createStaffMember = async (req, res) => {
  try {
    const { fullName, email, password, districtManagerId, role } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!fullName || !email || !password || !districtManagerId || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['SUPERVISOR', 'OPERATOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify district manager exists and belongs to this admin
    const dm = await User.findOne({
      where: { id: districtManagerId, role: 'DISTRICT_MANAGER', adminId }
    });
    if (!dm) {
      return res.status(404).json({ error: 'District manager not found' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate hierarchical ID
    const hierarchyCode = await generateStaffId(districtManagerId, role);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create staff member
    const staff = await User.create({
      fullName,
      email,
      passwordHash,
      role,
      status: 'APPROVED',
      adminId,
      districtManagerId,
      districtCode: dm.districtCode,
      hierarchyCode,
    });

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      data: {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
        hierarchyCode: staff.hierarchyCode,
      },
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
};

/**
 * Admin creates MPCS Officer under a District Manager
 */
exports.createMpcsOfficer = async (req, res) => {
  try {
    const { fullName, email, password, districtManagerId } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!fullName || !email || !password || !districtManagerId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify district manager exists and belongs to this admin
    const dm = await User.findOne({
      where: { id: districtManagerId, role: 'DISTRICT_MANAGER', adminId }
    });
    if (!dm) {
      return res.status(404).json({ error: 'District manager not found' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate hierarchical ID
    const hierarchyCode = await generateStaffId(districtManagerId, 'MPCS_OFFICER');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create MPCS Officer
    const mpcsOfficer = await User.create({
      fullName,
      email,
      passwordHash,
      role: 'MPCS_OFFICER',
      status: 'APPROVED',
      adminId,
      districtManagerId,
      districtCode: dm.districtCode,
      hierarchyCode,
      mpcsId: hierarchyCode, // For backward compatibility, set mpcsId to hierarchyCode
    });

    res.status(201).json({
      success: true,
      message: 'MPCS Officer created successfully',
      data: {
        id: mpcsOfficer.id,
        fullName: mpcsOfficer.fullName,
        email: mpcsOfficer.email,
        hierarchyCode: mpcsOfficer.hierarchyCode,
      },
    });
  } catch (error) {
    console.error('Error creating MPCS officer:', error);
    res.status(500).json({ error: 'Failed to create MPCS officer' });
  }
};

/**
 * Admin gets all staff under them (excluding farmers)
 */
exports.getAllStaff = async (req, res) => {
  try {
    const adminId = req.user.id;

    const staff = await User.findAll({
      where: {
        adminId,
        role: { [require('sequelize').Op.in]: ['DISTRICT_MANAGER', 'SUPERVISOR', 'OPERATOR', 'MPCS_OFFICER'] }
      },
      attributes: ['id', 'fullName', 'email', 'role', 'hierarchyCode', 'districtCode', 'status'],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

/**
 * Admin gets district managers under them
 */
exports.getDistrictManagers = async (req, res) => {
  try {
    const adminId = req.user.id;

    const dms = await User.findAll({
      where: {
        adminId,
        role: 'DISTRICT_MANAGER',
      },
      attributes: ['id', 'fullName', 'email', 'hierarchyCode', 'districtCode', 'status'],
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: dms,
    });
  } catch (error) {
    console.error('Error fetching district managers:', error);
    res.status(500).json({ error: 'Failed to fetch district managers' });
  }
};

/**
 * Admin gets all staff under a specific district manager
 */
exports.getStaffByDistrictManager = async (req, res) => {
  try {
    const { districtManagerId } = req.params;
    const adminId = req.user.id;

    // Verify DM belongs to this admin
    const dm = await User.findOne({
      where: { id: districtManagerId, role: 'DISTRICT_MANAGER', adminId }
    });
    if (!dm) {
      return res.status(404).json({ error: 'District manager not found' });
    }

    const staff = await User.findAll({
      where: {
        districtManagerId,
        role: { [require('sequelize').Op.in]: ['SUPERVISOR', 'OPERATOR', 'MPCS_OFFICER'] }
      },
      attributes: ['id', 'fullName', 'email', 'role', 'hierarchyCode', 'status'],
      order: [['role', 'ASC'], ['createdAt', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

/**
 * Admin updates a staff member
 */
exports.updateStaffMember = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { fullName, email, status } = req.body;
    const adminId = req.user.id;

    const staff = await User.findOne({
      where: { id: staffId, adminId }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (fullName) staff.fullName = fullName;
    if (email) staff.email = email;
    if (status && ['APPROVED', 'PENDING', 'REJECTED'].includes(status)) staff.status = status;

    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff,
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
};

/**
 * Admin deletes a staff member
 */
exports.deleteStaffMember = async (req, res) => {
  try {
    const { staffId } = req.params;
    const adminId = req.user.id;

    const staff = await User.findOne({
      where: { id: staffId, adminId }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    await staff.destroy();

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
};

module.exports = exports;
