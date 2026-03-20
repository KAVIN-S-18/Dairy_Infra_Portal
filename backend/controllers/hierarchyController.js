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

    // AUTO-PROVISION SAMPLE INFRASTRUCTURE FOR THE NEW DM
    const ChillerTank = require('../models/ChillerTank');
    const Machine = require('../models/Machine');

    // 1. Storage Samples
    const sampleTanks = [
        { tankId: `TANK-${dmId}-SILO-COW`, name: 'Raw Cow Milk Silo 1', milkType: 'COW', unitType: 'SILO', capacity: 15000 },
        { tankId: `TANK-${dmId}-SILO-BUF`, name: 'Raw Buffalo Milk Silo 1', milkType: 'BUFFALO', unitType: 'SILO', capacity: 15000 },
        { tankId: `TANK-${dmId}-INT-1`, name: 'Intermediate Process Tank A', milkType: 'MIXED', unitType: 'INTERMEDIATE', capacity: 5000 },
        { tankId: `TANK-${dmId}-PACK-1`, name: 'Finished Product Cold Store', milkType: 'PACKETS', unitType: 'PACKET_STORAGE', capacity: 5000 }
    ];

    for (const t of sampleTanks) {
        await ChillerTank.create({ ...t, dmId: dm.id, status: 'ACTIVE', currentLevel: 0 });
    }

    // 2. Machine Samples
    const sampleMachines = [
        { machineId: `MAC-${dmId}-CLR-1`, name: 'Auto-Clarifier C-100', type: 'CLARIFIER', capacity: 2000 },
        { machineId: `MAC-${dmId}-PAS-1`, name: 'Flash Pasteurizer P-200', type: 'PASTEURIZER', capacity: 3000 },
        { machineId: `MAC-${dmId}-HOM-1`, name: 'Industrial Homogenizer H-1', type: 'HOMOGENIZER', capacity: 2500 },
        { machineId: `MAC-${dmId}-PKR-1`, name: 'Rotary Packing Unit PK-4', type: 'PACKER', capacity: 1000 }
    ];

    for (const m of sampleMachines) {
        await Machine.create({ ...m, dmId: dm.id, status: 'IDLE', progress: 0 });
    }

    res.status(201).json({
      message: 'District Manager created and pre-provisioned with full sample infrastructure',
      dm: {
        id: dm.id,
        dmId: dm.dmId,
        fullName: dm.fullName,
        email: dm.email,
        infrastructure: 'PROVISIONED'
      },
    });
  } catch (error) {
    console.error('Error creating District Manager:', error);
    res.status(500).json({ success: false, message: 'Error creating District Manager', error: error.message });
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
    const { dmId, fullName, email, password, supervisorId: rawSupervisorId } = req.body;
    const supervisorId = (rawSupervisorId && rawSupervisorId !== 'null') ? parseInt(rawSupervisorId) : null;
    
    console.log(`[CreateOperator] Creating operator: ${fullName}, for supervisorId: ${supervisorId}`);

    const Operator = require('../models/Operator');
    const DistrictManager = require('../models/DistrictManager');
    const Supervisor = require('../models/Supervisor'); // Added for supervisor check

    const dm = await DistrictManager.findByPk(dmId);
    if (!dm) {
      return res.status(404).json({ error: 'District Manager not found' });
    }

    const existing = await Operator.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // If supervisorId is provided, check if the supervisor exists and belongs to this DM
    if (supervisorId) {
      const supervisor = await Supervisor.findByPk(supervisorId);
      if (!supervisor || supervisor.dmId !== dm.id) {
        return res.status(404).json({ error: 'Supervisor not found or does not belong to this District Manager' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const opPrefix = `${dmId}-OP`;
    const nextSeq = await getNextSequence(Operator, opPrefix, 'opId');
    const opId = `${opPrefix}${nextSeq}`;

    const op = await Operator.create({
      opId,
      adminId: dm.adminId,
      dmId: dm.id,
      supervisorId: supervisorId || null,
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

    const DistrictManager = require('../models/DistrictManager');
    const Supervisor = require('../models/Supervisor');
    const Operator = require('../models/Operator');
    const MPCSofficer = require('../models/MPCSofficer');
    const TransportManager = require('../models/TransportManager');
    const Driver = require('../models/Driver');
    const MotorVehicle = require('../models/MotorVehicle');

    const dm = await DistrictManager.findOne({ where: { dmId: req.params.dmId } });
    if (!dm) return res.status(404).json({ error: 'DM not found' });

    const supervisors = await Supervisor.findAll({ where: { dmId: dm.id }, attributes: { exclude: ['passwordHash'] } });
    const operators = await Operator.findAll({ where: { dmId: dm.id }, attributes: { exclude: ['passwordHash'] } });
    const mpcsOfficers = await MPCSofficer.findAll({ where: { dmId: dm.id }, attributes: { exclude: ['passwordHash'] } });
    const transportManagers = await TransportManager.findAll({ where: { dmId: dm.id }, attributes: { exclude: ['passwordHash'] } });
    const drivers = await Driver.findAll({ where: { dmId: dm.id }, attributes: { exclude: ['passwordHash'] } });
    const vehicles = await MotorVehicle.findAll({ where: { dmId: dm.id } });

    res.json({
      supervisors,
      operators,
      mpcsOfficers,
      transportManagers,
      drivers,
      vehicles
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
      dmId: tm.dmId,
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
      dmId: tm.dmId,
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

    let tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm && !isNaN(Number(tmId))) {
      tm = await TransportManager.findByPk(Number(tmId));
    }

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

    let tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm && !isNaN(Number(tmId))) {
      tm = await TransportManager.findByPk(Number(tmId));
    }

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

    let tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm && !isNaN(Number(tmId))) {
      tm = await TransportManager.findByPk(Number(tmId));
    }

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

// Get dispatches / milk procurements assigned to transport manager via trips
exports.getDispatchesByTransportManager = async (req, res) => {
  try {
    const { tmId } = req.params;
    let tm = await TransportManager.findOne({ where: { tmId } });
    if (!tm && !isNaN(Number(tmId))) {
      tm = await TransportManager.findByPk(Number(tmId));
    }
    if (!tm) return res.status(404).json({ error: 'Transport Manager not found' });

    const trips = await Trip.findAll({ where: { tmId: tm.id } });
    const tripIds = trips.map(t => t.tripId);

    const procurements = await require('../models/MilkProcurement').findAll({
      where: {
        assignedTripId: tripIds,
      },
      order: [['updatedAt', 'DESC']],
    });

    res.json({ trips, procurements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Trips by Driver
exports.getTripsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    let driver = await Driver.findOne({ where: { driverId } });
    if (!driver && !isNaN(Number(driverId))) {
      driver = await Driver.findByPk(Number(driverId));
    }

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const trips = await Trip.findAll({ where: { driverId: driver.id } });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Trip status/metrics
exports.updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { tripStatus, actualDistance, driverPayment, startTime, endTime } = req.body;

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (tripStatus) {
      trip.tripStatus = tripStatus;
      if (tripStatus === 'IN_PROGRESS' && !trip.startTime) {
        trip.startTime = new Date();
      }
      if (tripStatus === 'COMPLETED') {
        trip.endTime = endTime ? new Date(endTime) : new Date();
      }
    }
    if (actualDistance !== undefined) trip.actualDistance = actualDistance;
    if (driverPayment !== undefined) trip.driverPayment = driverPayment;
    if (startTime) trip.startTime = new Date(startTime);
    if (endTime) trip.endTime = new Date(endTime);

    await trip.save();

    // Sync procurement state when trip completed
    if (trip.tripStatus === 'COMPLETED') {
      const procurement = await require('../models/MilkProcurement').findOne({ where: { assignedTripId: trip.tripId } });
      if (procurement) {
        procurement.dispatchStatus = 'REACHED_DISTRICT';
        await procurement.save();
      }
    }

    res.json({ message: 'Trip updated successfully', trip });
  } catch (error) {
    console.error('Error updating trip:', error);
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

// Chiller Tank Management
exports.createChillerTank = async (req, res) => {
  try {
    const { tankId: requestedId, name, milkType, capacity, unitType } = req.body;
    const ChillerTank = require('../models/ChillerTank');

    const nextSeq = await getNextSequence(ChillerTank, 'TANK-', 'tankId');
    const tankId = requestedId || `TANK-${String(nextSeq).padStart(3, '0')}`;

    const tank = await ChillerTank.create({
      tankId,
      dmId: req.user.role === 'DISTRICT_MANAGER' ? req.user.id : (req.user.dmId || null),
      name: name || `${milkType} Tank ${nextSeq}`,
      unitType: unitType || 'SILO',
      milkType,
      capacity,
      currentLevel: 0,
      status: 'ACTIVE'
    });

    res.status(201).json({ success: true, message: 'Storage unit provisioned successfully', data: tank });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating storage unit', error: error.message });
  }
};

exports.getChillerTanks = async (req, res) => {
  try {
    const ChillerTank = require('../models/ChillerTank');
    const filter = {};
    if (req.user && req.user.role === 'DISTRICT_MANAGER') {
        filter.dmId = req.user.id;
    }
    const tanks = await ChillerTank.findAll({ where: filter });
    res.status(200).json({ success: true, data: tanks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tanks', error: error.message });
  }
};

exports.deleteChillerTank = async (req, res) => {
  try {
    const { id } = req.params;
    const ChillerTank = require('../models/ChillerTank');
    await ChillerTank.destroy({ where: { id } });
    res.status(200).json({ success: true, message: 'Tank deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting tank', error: error.message });
  }
};


// Machine Management
exports.createMachine = async (req, res) => {
  try {
    const { name, type, capacity, machineId: requestedId, imageUrl, lastMaintenanceDate } = req.body;
    const Machine = require('../models/Machine');
    const DistrictManager = require('../models/DistrictManager');

    let dmId = req.user.id;
    if (req.user.role === 'ADMIN') {
        const dm = await DistrictManager.findOne({ where: { adminId: req.user.id } });
        dmId = dm ? dm.id : null;
    }

    const nextSeq = await getNextSequence(Machine, 'MCH-', 'machineId');
    const machineId = requestedId || `MCH-${String(nextSeq).padStart(3, '0')}`;

    const machine = await Machine.create({
      machineId,
      name,
      type,
      capacity,
      dmId,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1500&auto=format&fit=crop',
      lastMaintenanceDate: lastMaintenanceDate || null,
      status: 'IDLE'
    });

    res.status(201).json({ success: true, message: 'Machine deployed successfully', data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating machine', error: error.message });
  }
};

exports.getMachines = async (req, res) => {
  try {
    const Machine = require('../models/Machine');
    const filter = {};
    if (req.user && req.user.role === 'DISTRICT_MANAGER') {
        filter.dmId = req.user.id;
    }
    const machines = await Machine.findAll({ where: filter });
    res.status(200).json({ success: true, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching machines', error: error.message });
  }
};

exports.updateMachine = async (req, res) => {
    try {
        const Machine = require('../models/Machine');
        await Machine.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true, message: 'Machine updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const Machine = require('../models/Machine');
    await Machine.destroy({ where: { id } });
    res.status(200).json({ success: true, message: 'Machine decommissioned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting machine', error: error.message });
  }
};

exports.updateChillerTank = async (req, res) => {
    try {
        const ChillerTank = require('../models/ChillerTank');
        await ChillerTank.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true, message: 'Storage unit updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getMPCSDispatches = async (req, res) => {
  try {
    const MPCSDispatch = require('../models/MPCSDispatch');
    const filter = {};
    const dispatches = await MPCSDispatch.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: dispatches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching logistics history', error: error.message });
  }
};

exports.updateMachine = async (req, res) => {
    try {
        const Machine = require('../models/Machine');
        await Machine.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true, message: 'Machine parameters updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createDeliveryRequest = async (req, res) => {
  try {
    const { batchId, quantity, destination } = req.body;
    const dmId = req.user.id;
    const DeliveryRequest = require('../models/DeliveryRequest');
    const Batch = require('../models/Batch');

    const nextId = await getNextSequence(DeliveryRequest, 'DEL-', 'deliveryId');
    const deliveryId = `DEL-${String(nextId).padStart(4, '0')}`;

    const delivery = await DeliveryRequest.create({
      deliveryId,
      batchId,
      districtManagerId: dmId,
      quantity,
      destination: destination || 'RETAIL_SHOP_GENERAL',
      status: 'PENDING'
    });

    // Option: Update batch status to 'AWAITING_DELIVERY'
    const batch = await Batch.findByPk(batchId);
    if (batch) {
        batch.status = 'AWAITING_DELIVERY';
        await batch.save();
    }

    res.status(201).json({ success: true, message: 'Delivery request created and sent to Transport Dept', data: delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating delivery request', error: err.message });
  }
};

exports.getDeliveryRequests = async (req, res) => {
  try {
    const DeliveryRequest = require('../models/DeliveryRequest');
    const filter = {};
    if (req.user.role === 'DISTRICT_MANAGER') filter.districtManagerId = req.user.id;
    const deliveries = await DeliveryRequest.findAll({ where: filter, order: [['createdAt', 'DESC']] });
    res.status(200).json({ success: true, data: deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching deliveries', error: err.message });
  }
};
