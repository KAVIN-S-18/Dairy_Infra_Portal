const FarmerMilkLog = require('../models/FarmerMilkLog');
const DairyInfrastructure = require('../models/DairyInfrastructure');
const MilkProcurement = require('../models/MilkProcurement');
const Farmer = require('../models/Farmer');

// Log milk production and sales
exports.logMilkProduction = async (req, res) => {
  try {
    const { quantityProduced, quantitySold, pricePerLiter, remarks } = req.body;
    const farmerId = req.user.id;

    const totalAmount = quantitySold * pricePerLiter;

    const log = await FarmerMilkLog.create({
      farmerId,
      quantityProduced,
      quantitySold,
      pricePerLiter,
      totalAmount,
      logDate: new Date(),
      remarks,
    });

    res.status(201).json({
      success: true,
      message: 'Milk log created successfully',
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating milk log',
      error: error.message,
    });
  }
};

// Get milk sales list (from official procurement records)
exports.getMilkSalesList = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { startDate, endDate } = req.query;

    const whereClause = { farmerId };
    if (startDate && endDate) {
      whereClause.procurementDate = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const logs = await MilkProcurement.findAll({
      where: whereClause,
      order: [['procurementDate', 'DESC']],
    });

    // Map procurement fields to frontend expected fields
    const formattedLogs = logs.map(log => ({
      id: log.id,
      logDate: log.procurementDate,
      quantityProduced: log.quantityLiters, // Simplification for UI
      quantitySold: log.quantityLiters,
      pricePerLiter: log.pricePerLiter,
      totalAmount: log.totalAmount,
      snf: log.snf,
      fat: log.fat,
      remarks: log.notes
    }));

    res.status(200).json({
      success: true,
      data: formattedLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching milk sales list',
      error: error.message,
    });
  }
};

// Add infrastructure
exports.addInfrastructure = async (req, res) => {
  try {
    const { equipmentName, equipmentType, purchaseDate, condition, maintenanceNotes } = req.body;
    const farmerId = req.user.id;

    const infrastructure = await DairyInfrastructure.create({
      farmerId,
      equipmentName,
      equipmentType,
      purchaseDate,
      condition,
      maintenanceNotes,
      lastMaintenanceDate: new Date(),
      nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    res.status(201).json({
      success: true,
      message: 'Infrastructure added successfully',
      data: infrastructure,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding infrastructure',
      error: error.message,
    });
  }
};

// Get infrastructure list
exports.getInfrastructure = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const infrastructure = await DairyInfrastructure.findAll({
      where: { farmerId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: infrastructure,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching infrastructure',
      error: error.message,
    });
  }
};

// Update infrastructure maintenance
exports.updateInfrastructureMaintenance = async (req, res) => {
  try {
    const { infrastructureId } = req.params;
    const { condition, maintenanceNotes } = req.body;

    const infrastructure = await DairyInfrastructure.findByPk(infrastructureId);
    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Infrastructure not found',
      });
    }

    infrastructure.condition = condition;
    infrastructure.maintenanceNotes = maintenanceNotes;
    infrastructure.lastMaintenanceDate = new Date();
    infrastructure.nextMaintenanceDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await infrastructure.save();

    res.status(200).json({
      success: true,
      message: 'Infrastructure maintenance updated',
      data: infrastructure,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating infrastructure',
      error: error.message,
    });
  }
};

// Get milk sales summary (from official procurement records)
exports.getMilkSalesSummary = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const logs = await MilkProcurement.findAll({
      where: { farmerId },
    });

    const summary = {
      totalProduced: logs.reduce((sum, log) => sum + log.quantityLiters, 0),
      totalSold: logs.reduce((sum, log) => sum + log.quantityLiters, 0),
      totalEarnings: logs.reduce((sum, log) => sum + log.totalAmount, 0),
      transactionCount: logs.length,
      averagePrice: logs.length > 0 ? logs.reduce((sum, log) => sum + log.pricePerLiter, 0) / logs.length : 0,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales summary',
      error: error.message,
    });
  }
};

// Get farmer complete profile with cattle and land details
exports.getFarmerProfile = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching farmer profile',
      error: error.message,
    });
  }
};

// Update farmer cattle details
exports.updateCattleDetails = async (req, res) => {
  try {
    const { cattleDetails } = req.body;
    const farmerId = req.user.id;

    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    farmer.cattleDetails = cattleDetails;
    farmer.numberOfCattle = cattleDetails?.totalCount || 0;
    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Cattle details updated successfully',
      data: farmer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cattle details',
      error: error.message,
    });
  }
};

// Update farmer land details
exports.updateLandDetails = async (req, res) => {
  try {
    const { landDetails } = req.body;
    const farmerId = req.user.id;

    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    farmer.landDetails = landDetails;
    farmer.farmSize = landDetails?.totalArea || 0;
    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Land details updated successfully',
      data: farmer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating land details',
      error: error.message,
    });
  }
};
