const Farmer = require('../models/Farmer');
const MilkProcurement = require('../models/MilkProcurement');
const User = require('../models/User');

// Add new farmer with hierarchical ID
exports.addFarmer = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, villageId, farmSize, numberOfCattle } = req.body;
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
    const { farmerId, quantityLiters, quality, temperature, pricePerLiter, notes, snf, fat, procurementDate } = req.body;
    const mpcsOfficerId = req.user.id;

    // Fetch the farmer regardless of who created them to avoid bugs with mock/admin data
    const farmer = await Farmer.findByPk(farmerId);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    const totalAmount = quantityLiters * pricePerLiter;

    const finalProcurementDate = procurementDate ? new Date(procurementDate) : new Date();

    const procurement = await MilkProcurement.create({
      farmerId,
      farmerFarmerId: farmer.farmerId,
      quantityLiters,
      quality,
      temperature,
      pricePerLiter,
      totalAmount,
      procurementDate: finalProcurementDate,
      loggedByMpcsOfficerId: mpcsOfficerId,
      notes,
      snf,
      fat
    });

    res.status(201).json({
      success: true,
      message: 'Milk procurement logged successfully',
      data: procurement,
    });
  } catch (error) {
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

    const summary = {
      totalQuantity: procurements.reduce((sum, p) => sum + p.quantityLiters, 0),
      totalAmount: procurements.reduce((sum, p) => sum + p.totalAmount, 0),
      totalTransactions: procurements.length,
      procurements,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching procurement summary',
      error: error.message,
    });
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
    const { landDetails, cattleDetails, fullName, phoneNumber, farmSize } = req.body;
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
    if (fullName) farmer.fullName = fullName;
    if (phoneNumber) farmer.phoneNumber = phoneNumber;
    if (farmSize) farmer.farmSize = farmSize;

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
