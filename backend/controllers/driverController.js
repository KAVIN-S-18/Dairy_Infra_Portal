const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const MilkProcurement = require('../models/MilkProcurement');
const MPCSDispatch = require('../models/MPCSDispatch');
const MotorVehicle = require('../models/MotorVehicle');

exports.getMyTrips = async (req, res) => {
  try {
    const driver = await Driver.findOne({ where: { email: req.user.email } });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const trips = await Trip.findAll({
      where: { driverId: driver.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching trips', error: error.message });
  }
};

exports.markPickedUp = async (req, res) => {
  try {
    const { tripId } = req.body;
    const trip = await Trip.findOne({ where: { tripId } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    trip.tripStatus = 'IN_PROGRESS';
    trip.startTime = new Date();
    await trip.save();

    // Update ALL linked MPCS Dispatches
    await MPCSDispatch.update({ status: 'EN_ROUTE_TO_DISTRICT' }, { where: { assignedTripId: tripId } });
    
    // Update ALL child procurements
    await MilkProcurement.update({ dispatchStatus: 'EN_ROUTE_TO_DISTRICT' }, { where: { assignedTripId: tripId } });

    res.status(200).json({ success: true, message: 'Trip started and milk marked as EN-ROUTE' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating trip status', error: error.message });
  }
};

exports.markReachedDistrict = async (req, res) => {
  try {
    const { tripId, actualDistance, fuelConsumed, temperature } = req.body;
    const trip = await Trip.findOne({ where: { tripId } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    trip.tripStatus = 'COMPLETED';
    trip.endTime = new Date();
    if (actualDistance) trip.actualDistance = actualDistance;
    if (fuelConsumed) trip.fuelConsumed = fuelConsumed;
    if (temperature) trip.temperature = temperature;
    await trip.save();

    // Update ALL linked MPCS Dispatches to REACHED_DISTRICT
    await MPCSDispatch.update({ status: 'REACHED_DISTRICT' }, { where: { assignedTripId: tripId } });
    
    // Update ALL child procurements
    await MilkProcurement.update({ dispatchStatus: 'REACHED_DISTRICT' }, { where: { assignedTripId: tripId } });

    // Mark driver and vehicle as active again
    const driver = await Driver.findByPk(trip.driverId);
    if (driver) { driver.status = 'ACTIVE'; await driver.save(); }

    const vehicle = await MotorVehicle.findByPk(trip.vehicleId);
    if (vehicle) { vehicle.status = 'ACTIVE'; await vehicle.save(); }

    res.status(200).json({ success: true, message: 'Trip completed and arrivals recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating trip status', error: error.message });
  }
};
