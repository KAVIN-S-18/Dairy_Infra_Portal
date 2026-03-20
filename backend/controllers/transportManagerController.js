const MilkProcurement = require('../models/MilkProcurement');
const MPCSDispatch = require('../models/MPCSDispatch');
const Driver = require('../models/Driver');
const MotorVehicle = require('../models/MotorVehicle');
const Trip = require('../models/Trip');
const TransportManager = require('../models/TransportManager');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// Helper for sequence IDs
const getNextSequence = async (Model, prefix, field) => {
  const latest = await Model.findOne({
    where: { [field]: { [Op.like]: `${prefix}%` } },
    order: [[field, 'DESC']]
  });
  if (!latest) return '001';
  const lastNum = parseInt(latest[field].replace(prefix, ''));
  return String(lastNum + 1).padStart(3, '0');
};

exports.getPendingDispatches = async (req, res) => {
  try {
    const tmUser = await TransportManager.findOne({ where: { email: req.user.email } });
    if (!tmUser) return res.status(404).json({ success: false, message: 'Transport Manager not found' });

    // Fetch grouped dispatches from MPCS centers that are waiting
    const dispatches = await MPCSDispatch.findAll({
      where: {
        status: 'WAITING_FOR_PICKUP'
      },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ success: true, data: dispatches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending dispatches', error: error.message });
  }
};

exports.getAvailableResources = async (req, res) => {
  try {
    const tmUser = await TransportManager.findOne({ where: { email: req.user.email } });
    if (!tmUser) return res.status(404).json({ success: false, message: 'Transport Manager not found' });

    const drivers = await Driver.findAll({
      where: { tmId: tmUser.id }
    });

    const vehicles = await MotorVehicle.findAll({
      where: { tmId: tmUser.id }
    });

    res.status(200).json({
      success: true,
      data: { drivers, vehicles }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching resources', error: error.message });
  }
};

exports.assignDriverAndVehicle = async (req, res) => {
  try {
    const { dispatchIds, driverId, vehicleId } = req.body;
    const tmUser = await TransportManager.findOne({ where: { email: req.user.email } });

    if (!dispatchIds || !Array.isArray(dispatchIds) || dispatchIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Select at least one dispatch request' });
    }

    const dispatches = await MPCSDispatch.findAll({
        where: { id: dispatchIds }
    });
    if (dispatches.length === 0) return res.status(404).json({ success: false, message: 'Dispatches not found' });

    const driver = await Driver.findByPk(driverId);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const vehicle = await MotorVehicle.findByPk(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const totalQty = dispatches.reduce((sum, d) => sum + d.totalQuantity, 0);
    const sourceNames = [...new Set(dispatches.map(d => d.mpcsName))].join(', ');
    const uniqueTypes = [...new Set(dispatches.map(d => d.milkType))];
    const tripType = uniqueTypes.length > 1 ? 'MIXED' : uniqueTypes[0];

    const tripCount = await Trip.count();
    const trip = await Trip.create({
      tripId: `TRIP-${new Date().getFullYear()}-${String(tripCount + 1).padStart(4, '0')}`,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.registrationNumber,
      driverId: driver.id,
      driverName: driver.fullName,
      tmId: tmUser.id,
      tmNumber: tmUser.tmId,
      source: dispatches.length > 1 ? `Multi-Point (${sourceNames})` : sourceNames,
      destination: 'District Chiller Center',
      tripDate: new Date(),
      milkQuantity: totalQty,
      milkType: tripType,
      estimatedDistance: 30 * dispatches.length, // Placeholder logic
      tripStatus: 'SCHEDULED',
    });

    // Update Dispatches AND child procurements
    for (const d of dispatches) {
        d.status = 'DRIVER_ASSIGNED';
        d.assignedTripId = trip.tripId;
        await d.save();

        await MilkProcurement.update({
            dispatchStatus: 'DRIVER_ASSIGNED',
            assignedTripId: trip.tripId,
            assignedDriverId: driver.id,
            assignedVehicleId: vehicle.id
        }, {
            where: { mpcsDispatchId: d.id }
        });
    }

    // Mark driver and vehicle as busy
    driver.status = 'INACTIVE';
    await driver.save();
    vehicle.status = 'MAINTENANCE'; 
    await vehicle.save();

    res.status(200).json({ success: true, message: 'Trip scheduled for ' + dispatches.length + ' MPCS centers', data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning transport', error: error.message });
  }
};

exports.getPendingDeliveries = async (req, res) => {
  try {
    const DeliveryRequest = require('../models/DeliveryRequest');
    const requests = await DeliveryRequest.findAll({
        where: { status: 'PENDING' },
        order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching delivery requests', error: err.message });
  }
};

exports.assignDelivery = async (req, res) => {
    try {
        const { deliveryRequestId, driverId, vehicleId } = req.body;
        const DeliveryRequest = require('../models/DeliveryRequest');
        const tmUser = await TransportManager.findOne({ where: { email: req.user.email } });

        const delReq = await DeliveryRequest.findByPk(deliveryRequestId);
        if (!delReq) return res.status(404).json({ success: false, message: 'Delivery request not found' });

        const driver = await Driver.findByPk(driverId);
        const vehicle = await MotorVehicle.findByPk(vehicleId);

        delReq.status = 'ASSIGNED';
        delReq.driverId = driverId;
        delReq.vehicleId = vehicleId;
        delReq.transportManagerId = tmUser.id;
        await delReq.save();

        if (driver) { driver.status = 'INACTIVE'; await driver.save(); }
        if (vehicle) { vehicle.status = 'MAINTENANCE'; await vehicle.save(); }

        res.status(200).json({ success: true, message: 'Delivery assigned to ' + driver.fullName });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error assigning delivery', error: err.message });
    }
};

exports.createDriver = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, drivingLicenseNumber, licenseExpiry, licenseClass } = req.body;
    const tmUser = await TransportManager.findOne({ where: { email: req.user.email } });

    const existing = await Driver.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const drPrefix = `${tmUser.tmId}-DR`;
    const nextSeq = await getNextSequence(Driver, drPrefix, 'driverId');
    const driverId = `${drPrefix}${nextSeq}`;

    const driver = await Driver.create({
      driverId,
      dmId: tmUser.dmId,
      tmId: tmUser.id,
      tmNumber: tmUser.tmId,
      dmNumber: tmUser.dmNumber,
      adminNumber: tmUser.adminNumber,
      fullName,
      email,
      passwordHash,
      phoneNumber,
      drivingLicenseNumber,
      licenseExpiry,
      licenseClass,
      status: 'ACTIVE',
    });

    await User.create({
      fullName,
      email,
      passwordHash,
      role: 'DRIVER',
      status: 'APPROVED',
      approvedAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Driver created successfully', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createMotorVehicle = async (req, res) => {
  try {
    const { registrationNumber, chasisNumber, engineNumber, vehicleType, manufactureBrand, year, capacity, registrationExpiry } = req.body;
    const tmUser = await TransportManager.findOne({ where: { email: req.user.email } });

    const vPrefix = `${tmUser.tmId}-V`;
    const nextSeq = await getNextSequence(MotorVehicle, vPrefix, 'vehicleId');
    const vehicleId = `${vPrefix}${nextSeq}`;

    const vehicle = await MotorVehicle.create({
      vehicleId,
      dmId: tmUser.dmId,
      tmId: tmUser.id,
      tmNumber: tmUser.tmId,
      dmNumber: tmUser.dmNumber,
      adminNumber: tmUser.adminNumber,
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

    res.status(201).json({ success: true, message: 'Motor Vehicle created successfully', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        await Driver.update(req.body, { where: { id } });
        res.status(200).json({ success: true, message: 'Driver updated' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        await Driver.destroy({ where: { id } });
        res.status(200).json({ success: true, message: 'Driver deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateMotorVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await MotorVehicle.update(req.body, { where: { id } });
        res.status(200).json({ success: true, message: 'Vehicle updated' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteMotorVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await MotorVehicle.destroy({ where: { id } });
        res.status(200).json({ success: true, message: 'Vehicle deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
