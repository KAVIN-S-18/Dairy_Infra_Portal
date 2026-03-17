const bcrypt = require('bcrypt');
const User = require('../models/User');
const Admin = require('../models/Admin');
const DistrictManager = require('../models/DistrictManager');
const Supervisor = require('../models/Supervisor');
const Operator = require('../models/Operator');
const MPCSofficer = require('../models/MPCSofficer');
const Farmer = require('../models/Farmer');
const TransportManager = require('../models/TransportManager');
const Driver = require('../models/Driver');
const MotorVehicle = require('../models/MotorVehicle');
const Trip = require('../models/Trip');
const { Op } = require('sequelize');

// Get next sequence number for a prefix
const getNextSequence = async (model, prefix, field = 'adminId') => {
  const records = await model.findAll({
    where: {
      [field]: {
        [Op.like]: `${prefix}%`,
      },
    },
    attributes: [field],
    raw: true,
  });

  if (records.length === 0) return 1;

  const numbers = records
    .map((r) => {
      const match = r[field].match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((n) => n > 0);

  return Math.max(...numbers, 0) + 1;
};

// Admin Management
exports.createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, organizationName, organizationType } = req.body;

    // Check if email exists
    const existing = await Admin.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nextSeq = await getNextSequence(Admin, '', 'adminId');
    const adminId = `A${nextSeq}`;

    const admin = await Admin.create({
      adminId,
      fullName,
      email,
      passwordHash,
      organizationName,
      organizationType,
      status: 'APPROVED',
      approvedAt: new Date(),
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        adminId: admin.adminId,
        fullName: admin.fullName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ['passwordHash'] },
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// District Manager Management
exports.createDistrictManager = async (req, res) => {
  try {
    const { adminId, fullName, email, password } = req.body;

    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const existing = await DistrictManager.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const dmPrefix = `${adminId}-DM`;
    const nextSeq = await getNextSequence(DistrictManager, dmPrefix, 'dmId');
    const dmId = `${dmPrefix}${nextSeq}`;

    const dm = await DistrictManager.create({
      dmId,
      adminId: admin.id,
      adminNumber: adminId,
      fullName,
      email,
      passwordHash,
      status: 'ACTIVE',
    });

    res.status(201).json({
      message: 'District Manager created successfully',
      dm: {
        id: dm.id,
        dmId: dm.dmId,
        fullName: dm.fullName,
        email: dm.email,
      },
    });
  } catch (error) {
    console.error('Error creating DM:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getDistrictManagersByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const dms = await DistrictManager.findAll({
      where: { adminId: admin.id },
      attributes: { exclude: ['passwordHash'] },
    });

    res.json(dms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supervisor Management
exports.createSupervisor = async (req, res) => {
  try {
    const { dmId, fullName, email, password, specialization } = req.body;

    const dm = await DistrictManager.findOne({ where: { dmId } });
    if (!dm) {
      return res.status(404).json({ error: 'District Manager not found' });
    }

    const existing = await Supervisor.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const supPrefix = `${dmId}-SUP`;
    const nextSeq = await getNextSequence(Supervisor, supPrefix, 'supId');
    const supId = `${supPrefix}${nextSeq}`;

    const sup = await Supervisor.create({
      supId,
      adminId: dm.adminId,
      dmId: dm.id,
      adminNumber: dm.adminNumber,
      dmNumber: dm.dmId,
      fullName,
      email,
      passwordHash,
      status: 'ACTIVE',
      specialization: specialization || 'PRODUCTION',
    });

    res.status(201).json({
      message: 'Supervisor created successfully',
      supervisor: {
        id: sup.id,
        supId: sup.supId,
        fullName: sup.fullName,
        email: sup.email,
      },
    });
  } catch (error) {
    console.error('Error creating supervisor:', error);
    res.status(500).json({ error: error.message });
  }
};

// Operator Management
exports.createOperator = async (req, res) => {
  try {
    const { dmId, fullName, email, password } = req.body;

    const dm = await DistrictManager.findOne({ where: { dmId } });
    if (!dm) {
      return res.status(404).json({ error: 'District Manager not found' });
    }

    const existing = await Operator.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const opPrefix = `${dmId}-OP`;
    const nextSeq = await getNextSequence(Operator, opPrefix, 'opId');
    const opId = `${opPrefix}${nextSeq}`;

    const op = await Operator.create({
      opId,
      adminId: dm.adminId,
      dmId: dm.id,
      adminNumber: dm.adminNumber,
      dmNumber: dm.dmId,
      fullName,
      email,
      passwordHash,
      status: 'ACTIVE',
    });

    res.status(201).json({
      message: 'Operator created successfully',
      operator: {
        id: op.id,
        opId: op.opId,
        fullName: op.fullName,
        email: op.email,
      },
    });
  } catch (error) {
    console.error('Error creating operator:', error);
    res.status(500).json({ error: error.message });
  }
};

// MPCS Officer Management
exports.createMPCSofficer = async (req, res) => {
  try {
    const { dmId, fullName, email, password } = req.body;

    const dm = await DistrictManager.findOne({ where: { dmId } });
    if (!dm) {
      return res.status(404).json({ error: 'District Manager not found' });
    }

    const existing = await MPCSofficer.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const mpcsPrefix = `${dmId}-MPCS`;
    const nextSeq = await getNextSequence(MPCSofficer, mpcsPrefix, 'mpcsId');
    const mpcsId = `${mpcsPrefix}${nextSeq}`;

    const mpcsOfficer = await MPCSofficer.create({
      mpcsId,
      adminId: dm.adminId,
      dmId: dm.id,
      adminNumber: dm.adminNumber,
      dmNumber: dm.dmId,
      fullName,
      email,
      passwordHash,
      status: 'ACTIVE',
    });

    res.status(201).json({
      message: 'MPCS Officer created successfully',
      mpcsOfficer: {
        id: mpcsOfficer.id,
        mpcsId: mpcsOfficer.mpcsId,
        fullName: mpcsOfficer.fullName,
        email: mpcsOfficer.email,
      },
    });
  } catch (error) {
    console.error('Error creating MPCS officer:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStaffByDistrictManager = async (req, res) => {
  try {
    const { dmId } = req.params;

    const dm = await DistrictManager.findOne({ where: { dmId } });
    if (!dm) {
      return res.status(404).json({ error: 'District Manager not found' });
    }

    const supervisors = await Supervisor.findAll({
      where: { dmId: dm.id },
      attributes: { exclude: ['passwordHash'] },
    });

    const operators = await Operator.findAll({
      where: { dmId: dm.id },
      attributes: { exclude: ['passwordHash'] },
    });

    const mpcsOfficers = await MPCSofficer.findAll({
      where: { dmId: dm.id },
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({
      supervisors,
      operators,
      mpcsOfficers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const supervisors = await Supervisor.findAll({
      attributes: { exclude: ['passwordHash'] },
    });

    const operators = await Operator.findAll({
      attributes: { exclude: ['passwordHash'] },
    });

    const mpcsOfficers = await MPCSofficer.findAll({
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({
      supervisors,
      operators,
      mpcsOfficers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { fullName, email, status } = req.body;

    let model, record;

    switch (type) {
      case 'supervisor':
        model = Supervisor;
        record = await model.findByPk(id);
        break;
      case 'operator':
        model = Operator;
        record = await model.findByPk(id);
        break;
      case 'mpcs-officer':
        model = MPCSofficer;
        record = await model.findByPk(id);
        break;
      default:
        return res.status(400).json({ error: 'Invalid staff type' });
    }

    if (!record) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (fullName) record.fullName = fullName;
    if (status) record.status = status;

    await record.save();

    res.json({
      message: 'Staff updated successfully',
      staff: record,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id, type } = req.params;

    let model;

    switch (type) {
      case 'supervisor':
        model = Supervisor;
        break;
      case 'operator':
        model = Operator;
        break;
      case 'mpcs-officer':
        model = MPCSofficer;
        break;
      default:
        return res.status(400).json({ error: 'Invalid staff type' });
    }

    const result = await model.destroy({ where: { id } });

    if (result === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Transport Manager Management
exports.createTransportManager = async (req, res) => {
  try {
    const { dmId, fullName, email, password, phoneNumber, licenseNumber, licenseExpiry } = req.body;

    const dm = await DistrictManager.findOne({ where: { dmId } });
    if (!dm) {
      return res.status(404).json({ error: 'District Manager not found' });
    }

    const existing = await TransportManager.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const tmPrefix = `${dmId}-TM`;
    const nextSeq = await getNextSequence(TransportManager, tmPrefix, 'tmId');
    const tmId = `${tmPrefix}${nextSeq}`;

    const tm = await TransportManager.create({
      tmId,
      dmId: dm.id,
      dmNumber: dm.dmId,
      adminNumber: dm.adminNumber,
      fullName,
      email,
      passwordHash,
      phoneNumber,
      licenseNumber,
      licenseExpiry,
      status: 'ACTIVE',
    });

    // Create User record
    await User.create({
      fullName,
      email,
      passwordHash,
      role: 'TRANSPORT_MANAGER',
      status: 'APPROVED',
      approvedAt: new Date(),
    });

    res.status(201).json({
      message: 'Transport Manager created successfully',
      transportManager: {
        id: tm.id,
        tmId: tm.tmId,
        fullName: tm.fullName,
        email: tm.email,
      },
    });
  } catch (error) {
    console.error('Error creating transport manager:', error);
    res.status(500).json({ error: error.message });
  }
};

// Driver Management
exports.createDriver = async (req, res) => {
  try {
    const { tmId, fullName, email, password, phoneNumber, drivingLicenseNumber, licenseExpiry, licenseClass } = req.body;

    const tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm) {
      return res.status(404).json({ error: 'Transport Manager not found' });
    }

    const existing = await Driver.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const drPrefix = `${tmId}-DR`;
    const nextSeq = await getNextSequence(Driver, drPrefix, 'driverId');
    const driverId = `${drPrefix}${nextSeq}`;

    const driver = await Driver.create({
      driverId,
      tmId: tm.id,
      tmNumber: tm.tmId,
      dmNumber: tm.dmNumber,
      adminNumber: tm.adminNumber,
      fullName,
      email,
      passwordHash,
      phoneNumber,
      drivingLicenseNumber,
      licenseExpiry,
      licenseClass,
      status: 'ACTIVE',
    });

    // Create User record
    await User.create({
      fullName,
      email,
      passwordHash,
      role: 'DRIVER',
      status: 'APPROVED',
      approvedAt: new Date(),
    });

    res.status(201).json({
      message: 'Driver created successfully',
      driver: {
        id: driver.id,
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
      },
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: error.message });
  }
};

// Motor Vehicle Management
exports.createMotorVehicle = async (req, res) => {
  try {
    const { tmId, registrationNumber, chasisNumber, engineNumber, vehicleType, manufactureBrand, year, capacity, registrationExpiry } = req.body;

    const tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm) {
      return res.status(404).json({ error: 'Transport Manager not found' });
    }

    const vPrefix = `${tmId}-V`;
    const nextSeq = await getNextSequence(MotorVehicle, vPrefix, 'vehicleId');
    const vehicleId = `${vPrefix}${nextSeq}`;

    const vehicle = await MotorVehicle.create({
      vehicleId,
      tmId: tm.id,
      tmNumber: tm.tmId,
      dmNumber: tm.dmNumber,
      adminNumber: tm.adminNumber,
      registrationNumber,
      chasisNumber,
      engineNumber,
      vehicleType,
      manufactureBrand,
      year,
      capacity,
      registrationExpiry,
      status: 'ACTIVE',
    });

    res.status(201).json({
      message: 'Motor Vehicle created successfully',
      vehicle: {
        id: vehicle.id,
        vehicleId: vehicle.vehicleId,
        registrationNumber: vehicle.registrationNumber,
        capacity: vehicle.capacity,
      },
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Transport Manager Staff
exports.getTransportManagerStaff = async (req, res) => {
  try {
    const { tmId } = req.params;

    const tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm) {
      return res.status(404).json({ error: 'Transport Manager not found' });
    }

    const drivers = await Driver.findAll({
      where: { tmId: tm.id },
      attributes: { exclude: ['passwordHash'] },
    });

    const vehicles = await MotorVehicle.findAll({
      where: { tmId: tm.id },
      attributes: { exclude: [] },
    });

    res.json({
      transportManager: {
        id: tm.id,
        tmId: tm.tmId,
        fullName: tm.fullName,
      },
      drivers,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Transport Manager by District Manager
exports.getTransportManagersByDistrictManager = async (req, res) => {
  try {
    const { dmId } = req.params;

    const dm = await DistrictManager.findOne({ where: { dmId } });
    if (!dm) {
      return res.status(404).json({ error: 'District Manager not found' });
    }

    const transportManagers = await TransportManager.findAll({
      where: { dmId: dm.id },
      attributes: { exclude: ['passwordHash'] },
    });

    res.json(transportManagers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Driver by Transport Manager
exports.getDriversByTransportManager = async (req, res) => {
  try {
    const { tmId } = req.params;

    const tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm) {
      return res.status(404).json({ error: 'Transport Manager not found' });
    }

    const drivers = await Driver.findAll({
      where: { tmId: tm.id },
      attributes: { exclude: ['passwordHash'] },
    });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Vehicles by Transport Manager
exports.getVehiclesByTransportManager = async (req, res) => {
  try {
    const { tmId } = req.params;

    const tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm) {
      return res.status(404).json({ error: 'Transport Manager not found' });
    }

    const vehicles = await MotorVehicle.findAll({
      where: { tmId: tm.id },
    });

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Trip
exports.createTrip = async (req, res) => {
  try {
    const { vehicleId, driverId, source, destination, tripDate, milkQuantity, estimatedDistance } = req.body;

    const vehicle = await MotorVehicle.findOne({ where: { vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const driver = await Driver.findOne({ where: { driverId } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const tripPrefix = 'TRIP';
    const nextSeq = await getNextSequence(Trip, tripPrefix, 'tripId');
    const tripId = `${tripPrefix}-${new Date().getFullYear()}-${String(nextSeq).padStart(4, '0')}`;

    const trip = await Trip.create({
      tripId,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.registrationNumber,
      driverId: driver.id,
      driverName: driver.fullName,
      tmId: vehicle.tmId,
      tmNumber: vehicle.tmNumber,
      source,
      destination,
      tripDate,
      milkQuantity,
      estimatedDistance,
      tripStatus: 'SCHEDULED',
    });

    res.status(201).json({
      message: 'Trip created successfully',
      trip: {
        id: trip.id,
        tripId: trip.tripId,
        vehicleNumber: trip.vehicleNumber,
        driverName: trip.driverName,
      },
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Trips by Transport Manager
exports.getTripsByTransportManager = async (req, res) => {
  try {
    const { tmId } = req.params;

    const tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm) {
      return res.status(404).json({ error: 'Transport Manager not found' });
    }

    const trips = await Trip.findAll({
      where: { tmId: tm.id },
    });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Transport Staff
exports.deleteTransportStaff = async (req, res) => {
  try {
    const { type, id } = req.params;

    let model;
    switch (type) {
      case 'transport-manager':
        model = TransportManager;
        break;
      case 'driver':
        model = Driver;
        break;
      case 'vehicle':
        model = MotorVehicle;
        break;
      default:
        return res.status(400).json({ error: 'Invalid staff type' });
    }

    const result = await model.destroy({ where: { id } });

    if (result === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
