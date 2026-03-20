const Farmer = require('../models/Farmer');
const MilkProcurement = require('../models/MilkProcurement');
const User = require('../models/User');
const Driver = require('../models/Driver');
const MotorVehicle = require('../models/MotorVehicle');
const Trip = require('../models/Trip');
const MPCSofficer = require('../models/MPCSofficer');

const assignTransport = async (procurement) => {
  // Manual assignment now required by user flow
  // Transport assignment will now be handled by the Transport Manager in their own dashboard
  procurement.dispatchStatus = 'WAITING_FOR_PICKUP';
  await procurement.save();
  return procurement;
};

// Add new farmer with hierarchical ID
exports.addFarmer = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, dateOfBirth, villageId, farmSize, numberOfCattle } = req.body;
    const mpcsOfficerId = req.user.id;

    // Get MPCS Officer details
    const mpcsOfficer = await User.findByPk(mpcsOfficerId);
    if (!mpcsOfficer || mpcsOfficer.role !== 'MPCS_OFFICER') {
      return res.status(403).json({
        success: false,
        message: 'Only MPCS Officers can add farmers',
      });
    }

    // Use hierarchical ID from MPCS Officer (e.g., DIST-1-MPCS-1)
    const mpcsHierarchyId = mpcsOfficer.hierarchyCode || mpcsOfficer.mpcsId;

    // Count existing farmers for this MPCS officer
    const farmerCount = await Farmer.count({
      where: { createdByMpcsOfficerId: mpcsOfficerId }
    });

    // Generate Farmer ID: DIST-1-MPCS-1-1, DIST-1-MPCS-1-2, etc.
    const farmerId = `${mpcsHierarchyId}-${farmerCount + 1}`;

    const farmer = await Farmer.create({
      farmerId,
      fullName,
      email,
      phoneNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      villageId,
      farmSize,
      numberOfCattle,
      createdByMpcsOfficerId: mpcsOfficerId,
      mpcsOfficerMpcsId: mpcsHierarchyId,
    });

    res.status(201).json({
      success: true,
      message: 'Farmer added successfully',
      data: farmer,
    });
  } catch (error) {
    console.error('Error adding farmer:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding farmer',
      error: error.message,
    });
  }
};

// Get all farmers added by MPCS officer
exports.getFarmers = async (req, res) => {
  try {
    const mpcsOfficerId = req.user.id;
    const farmers = await Farmer.findAll({
      where: { createdByMpcsOfficerId: mpcsOfficerId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: farmers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching farmers',
      error: error.message,
    });
  }
};

// Get farmers by ID (for milk procurement selection)
exports.getFarmersByIds = async (req, res) => {
  try {
    const mpcsOfficerId = req.user.id;
    const farmers = await Farmer.findAll({
      where: { createdByMpcsOfficerId: mpcsOfficerId },
      attributes: ['id', 'farmerId', 'fullName', 'email', 'phoneNumber'],
      order: [['farmerId', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: farmers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching farmers',
      error: error.message,
    });
  }
};

// Log daily milk procurement
exports.logMilkProcurement = async (req, res) => {
  try {
    console.log('[logMilkProcurement] body', req.body);
    const { farmerId, quantityLiters, milkType, session, temperature, pricePerLiter, notes, snf, fat, procurementDate } = req.body;
    const mpcsOfficerId = req.user.id;

    const quantity = parseFloat(quantityLiters);
    const price = parseFloat(pricePerLiter);
    const snfValue = snf !== undefined ? parseFloat(snf) : null;
    const fatValue = fat !== undefined ? parseFloat(fat) : null;
    const tempValue = temperature !== undefined ? parseFloat(temperature) : null;

    if (!farmerId || Number.isNaN(quantity) || Number.isNaN(price) || !session) {
      return res.status(400).json({ success: false, message: 'Missing required procurement fields or invalid numbers.' });
    }

    const farmer = await Farmer.findByPk(farmerId);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    const totalAmount = quantity * price;

    const finalProcurementDate = procurementDate ? new Date(procurementDate) : new Date();
    if (Number.isNaN(finalProcurementDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid procurement date' });
    }
    const hour = finalProcurementDate.getHours();

    if (!['MORNING', 'EVENING'].includes(session)) {
      return res.status(400).json({ success: false, message: 'Invalid session. Choose MORNING or EVENING.' });
    }

    if (session === 'MORNING' && (hour < 6 || hour > 15)) {
      return res.status(400).json({ success: false, message: 'Morning milk log must be between 06:00 and 15:59.' });
    }
    if (session === 'EVENING' && !((hour >= 16 && hour <= 23) || (hour >=0 && hour <= 5))) {
      return res.status(400).json({ success: false, message: 'Evening milk log must be between 16:00 and 05:59 next day.' });
    }

    const procurement = await MilkProcurement.create({
      farmerId,
      farmerFarmerId: farmer.farmerId,
      quantityLiters: quantity,
      milkType: milkType || 'COW',
      session,
      temperature: tempValue,
      pricePerLiter: price,
      totalAmount,
      procurementDate: finalProcurementDate,
      loggedByMpcsOfficerId: mpcsOfficerId,
      notes,
      snf: snfValue,
      fat: fatValue,
      isDispatched: false,
      dispatchedAt: null,
    });

    res.status(201).json({
      success: true,
      message: 'Milk procurement logged successfully',
      data: procurement,
    });
  } catch (error) {
    console.error('Error logging milk procurement', error);
    res.status(500).json({
      success: false,
      message: 'Error logging milk procurement',
      error: error.message,
    });
  }
};

// Get daily procurement summary
exports.getProcurementSummary = async (req, res) => {
  try {
    const mpcsOfficerId = req.user.id;
    const { startDate, endDate } = req.query;
    console.log('[getProcurementSummary] called mpcsOfficerId=', mpcsOfficerId, 'startDate=', startDate, 'endDate=', endDate);

    const whereClause = { loggedByMpcsOfficerId: mpcsOfficerId };
    if (startDate && endDate) {
      whereClause.procurementDate = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const procurements = await MilkProcurement.findAll({
      where: whereClause,
      order: [['procurementDate', 'DESC']],
    });

    const now = new Date();
    for (const p of procurements) {
      try {
        if (!p || !p.procurementDate || !p.session) continue;

        if (p.dispatchStatus !== 'PENDING' && p.dispatchStatus !== 'WAITING_FOR_VEHICLE') continue;

        const procTime = new Date(p.procurementDate);
        if (Number.isNaN(procTime.getTime())) continue;

        let shouldAuto = false;
        if (p.session === 'MORNING') {
          const morningEnd = new Date(procTime);
          morningEnd.setHours(15, 59, 59, 999);
          if (now >= morningEnd) shouldAuto = true;
        } else if (p.session === 'EVENING') {
          const eveningEnd = new Date(procTime);
          eveningEnd.setDate(eveningEnd.getDate() + 1);
          eveningEnd.setHours(6, 0, 0, 0);
          if (now >= eveningEnd) shouldAuto = true;
        }

        if (shouldAuto) {
          p.dispatchStatus = 'PENDING';
          p.isDispatched = true;
          p.dispatchedAt = p.dispatchedAt || now;
          await p.save();

          try {
            await assignTransport(p);
          } catch (assignError) {
            console.error('Assign transport error for procurement', p.id, assignError);
          }
        }
      } catch (innerError) {
        console.error('Procurement summary loop error for record', p?.id, innerError);
      }
    }

    const totalQuantity = procurements.reduce((sum, p) => sum + p.quantityLiters, 0);
    const totalAmount = procurements.reduce((sum, p) => sum + p.totalAmount, 0);

    const typeCounts = procurements.reduce((acc, p) => {
      const key = p.milkType || 'COW';
      acc[key] = (acc[key] || 0) + p.quantityLiters;
      return acc;
    }, {});

    const summary = {
      totalQuantity,
      totalAmount,
      totalTransactions: procurements.length,
      typeCounts,
      dispatchedQuantity: procurements.filter(p => p.isDispatched).reduce((sum, p) => sum + p.quantityLiters, 0),
      procurements,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[getProcurementSummary] error', error);
    res.status(200).json({
      success: false,
      message: 'Error fetching milk procurements summary, returning empty data',
      data: {
        totalQuantity: 0,
        totalAmount: 0,
        totalTransactions: 0,
        typeCounts: { COW: 0, BUFFALO: 0 },
        dispatchedQuantity: 0,
        procurements: [],
      },
      error: error.message,
    });
  }
};

// Bulk Dispatch per milk type (Groups automatically by session)
exports.dispatchBulk = async (req, res) => {
  try {
    const { milkType } = req.body;
    const mpcsOfficerId = req.user.id;
    const MPCSDispatch = require('../models/MPCSDispatch');
    const MPCSofficer = require('../models/MPCSofficer');

    if (!['COW', 'BUFFALO'].includes(milkType)) {
        return res.status(400).json({ success: false, message: 'Invalid milk type' });
    }

    // 1. Find all non-dispatched logs for this MPCS and matching type
    const pendingLogs = await MilkProcurement.findAll({
      where: {
        loggedByMpcsOfficerId: mpcsOfficerId,
        milkType,
        isDispatched: false
      }
    });

    if (pendingLogs.length === 0) {
      return res.status(400).json({ success: false, message: `No pending ${milkType} records to dispatch` });
    }

    const mpcsOfficer = await MPCSofficer.findByPk(mpcsOfficerId);
    if (!mpcsOfficer) return res.status(404).json({ success: false, message: 'MPCS details not found' });

    // 2. Group logs by Session
    const sessionGroups = pendingLogs.reduce((acc, log) => {
      const sess = log.session || 'MORNING';
      if (!acc[sess]) acc[sess] = [];
      acc[sess].push(log);
      return acc;
    }, {});

    const results = [];
    const dateStr = new Date().toISOString().split('T')[0];

    // 3. Create a Dispatch Batch for each session
    for (const [session, logs] of Object.entries(sessionGroups)) {
      const totalQty = logs.reduce((sum, log) => sum + log.quantityLiters, 0);
      const dispatchId = `DISP-${mpcsOfficer.id}-${dateStr}-${milkType}-${session}-${Date.now().toString().slice(-4)}`;

      const groupedDispatch = await MPCSDispatch.create({
        dispatchId,
        mpcsOfficerId,
        mpcsName: mpcsOfficer.fullName,
        milkType,
        session,
        totalQuantity: totalQty,
        status: 'WAITING_FOR_PICKUP'
      });

      // Link logs
      for (const log of logs) {
        log.isDispatched = true;
        log.dispatchedAt = new Date();
        log.dispatchStatus = 'WAITING_FOR_PICKUP';
        log.mpcsDispatchId = groupedDispatch.id;
        await log.save();
      }
      results.push(groupedDispatch);
    }

    res.status(200).json({
      success: true,
      message: `Dispatched ${results.length} session(s) of ${milkType} milk successfully.`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error in session dispatch', error: error.message });
  }
};

// Dispatch a single procurement record (Legacy/Trigger for bulk)
exports.dispatchProcurement = async (req, res) => {
  // Now simply redirects to the bulk logic for better UX
  try {
    const { procurementId } = req.params;
    const target = await MilkProcurement.findByPk(procurementId);
    if (!target) return res.status(404).json({ success: false, message: 'Record not found' });
    req.body = { milkType: target.milkType, session: target.session };
    return exports.dispatchBulk(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error in dispatch', error: error.message });
  }
};

exports.getMpcsDispatches = async (req, res) => {
  try {
    const MPCSDispatch = require('../models/MPCSDispatch');
    const mpcsOfficerId = req.user.id;
    const dispatches = await MPCSDispatch.findAll({
      where: { mpcsOfficerId },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: dispatches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dispatches', error: error.message });
  }
};

// Mark procurement as reached district
exports.markReachedDistrict = async (req, res) => {
  try {
    const { procurementId } = req.params;
    const procurement = await MilkProcurement.findByPk(procurementId);

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement not found' });
    }

    procurement.dispatchStatus = 'REACHED_DISTRICT';
    await procurement.save();

    if (procurement.assignedTripId) {
      const trip = await Trip.findOne({ where: { tripId: procurement.assignedTripId } });
      if (trip) {
        trip.tripStatus = 'COMPLETED';
        trip.endTime = new Date();
        await trip.save();
      }
    }

    res.status(200).json({ success: true, message: 'Procurement marked as reached district', data: procurement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking district arrival', error: error.message });
  }
};

// Update farmer status
exports.updateFarmerStatus = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { status } = req.body;

    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    farmer.status = status;
    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Farmer status updated successfully',
      data: farmer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating farmer status',
      error: error.message,
    });
  }
};

// Get farmer detailed profile with cattle and land details
exports.getFarmerDetails = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const mpcsOfficerId = req.user.id;

    // Verify farmer belongs to this MPCS officer
    const farmer = await Farmer.findOne({
      where: { id: farmerId, createdByMpcsOfficerId: mpcsOfficerId }
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    // Get associated data
    const FarmerMilkLog = require('../models/FarmerMilkLog');
    const DairyInfrastructure = require('../models/DairyInfrastructure');

    const milkLogs = await FarmerMilkLog.findAll({
      where: { farmerId },
      order: [['logDate', 'DESC']],
      limit: 10,
    });

    const infrastructure = await DairyInfrastructure.findAll({
      where: { farmerId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        farmer,
        milkLogs,
        infrastructure,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching farmer details',
      error: error.message,
    });
  }
};

// Update farmer details (cattle and land info) as MPCS Officer
exports.updateFarmerDetails = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { landDetails, cattleDetails, numberOfCattle, fullName, phoneNumber, farmSize, villageId } = req.body;
    const mpcsOfficerId = req.user.id;

    // Verify farmer belongs to this MPCS officer
    const farmer = await Farmer.findOne({
      where: { id: farmerId, createdByMpcsOfficerId: mpcsOfficerId }
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    if (landDetails) farmer.landDetails = landDetails;
    if (cattleDetails) farmer.cattleDetails = cattleDetails;
    if (numberOfCattle !== undefined) farmer.numberOfCattle = numberOfCattle;
    if (fullName) farmer.fullName = fullName;
    if (phoneNumber) farmer.phoneNumber = phoneNumber;
    if (farmSize) farmer.farmSize = farmSize;
    if (villageId !== undefined) farmer.villageId = villageId;

    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Farmer details updated successfully',
      data: farmer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating farmer details',
      error: error.message,
    });
  }
};
