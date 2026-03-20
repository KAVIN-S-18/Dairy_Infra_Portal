const WorkAssignment = require('../models/WorkAssignment');
const OperatorLog = require('../models/OperatorLog');
const { Op } = require('sequelize');

// Create batch and assign work
exports.createBatchAndAssignWork = async (req, res) => {
  try {
    const { operatorId, taskDescription, milkQuantity, stage, expectedEndTime } = req.body;
    const supervisorId = req.user.id;
    const batchId = `BATCH-${Date.now()}`;

    const workAssignment = await WorkAssignment.create({
      batchId,
      operatorId,
      supervisorId,
      taskDescription,
      milkQuantity,
      stage,
      startTime: new Date(),
      expectedEndTime,
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Work assigned successfully',
      data: workAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating work assignment',
      error: error.message,
    });
  }
};

// Get all work assignments for supervisor
exports.getWorkAssignments = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const assignments = await WorkAssignment.findAll({
      where: { supervisorId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching work assignments',
      error: error.message,
    });
  }
};

// Collection tasks (for COLLECTION supervisors)
exports.getCollectionTasks = async (req, res) => {
  try {
    let { id: supervisorId, specialization } = req.user;
    const Supervisor = require('../models/Supervisor');

    // Robustness: If specialization is missing from token (stale session), fetch from DB
    if (!specialization) {
      const sup = await Supervisor.findByPk(supervisorId);
      if (sup) specialization = sup.specialization;
    }

    if (specialization !== 'COLLECTION') {
      return res.status(200).json({ success: true, data: [] }); 
    }

    const MPCSDispatch = require('../models/MPCSDispatch');
    const tasks = await MPCSDispatch.findAll({
      where: {
        status: { [Op.in]: ['REACHED_DISTRICT', 'RECEIVED_BY_DISTRICT', 'MOVED_TO_CHILLER'] },
      },
      order: [['updatedAt', 'DESC']],
    });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching collection tasks', error: error.message });
  }
};

exports.collectMilk = async (req, res) => {
  try {
    let { id: supervisorId, specialization } = req.user;
    const Supervisor = require('../models/Supervisor');
    
    // Robustness: fallback specialization fetch
    if (!specialization) {
      const sup = await Supervisor.findByPk(supervisorId);
      if (sup) specialization = sup.specialization;
    }

    if (specialization !== 'COLLECTION') {
      return res.status(403).json({ success: false, message: 'Only collection supervisors can receive milk' });
    }

    const { procurementId: dispatchId } = req.params;
    const MPCSDispatch = require('../models/MPCSDispatch');
    const MilkProcurement = require('../models/MilkProcurement');
    
    const dispatch = await MPCSDispatch.findByPk(dispatchId);
    if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch record not found' });

    if (dispatch.status !== 'REACHED_DISTRICT') {
      return res.status(400).json({ success: false, message: 'Milk has not yet reached district' });
    }

    dispatch.status = 'RECEIVED_BY_DISTRICT';
    await dispatch.save();

    // Cascading update to all individual logs
    await MilkProcurement.update({ dispatchStatus: 'RECEIVED_BY_DISTRICT' }, {
        where: { mpcsDispatchId: dispatch.id }
    });

    res.status(200).json({ success: true, message: 'MPCS Bulk session received at District' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error receiving milk', error: error.message });
  }
};

exports.completeMilk = async (req, res) => {
  try {
    let { id: supervisorId, specialization } = req.user;
    const Supervisor = require('../models/Supervisor');

    if (!specialization) {
        const sup = await Supervisor.findByPk(supervisorId);
        if (sup) specialization = sup.specialization;
    }

    if (specialization !== 'COLLECTION') {
      return res.status(403).json({ success: false, message: 'Only collection supervisors can move milk to chiller' });
    }

    const { procurementId: dispatchId } = req.params;
    const { chillerTankId } = req.body; // Added tank selection support

    const MPCSDispatch = require('../models/MPCSDispatch');
    const MilkProcurement = require('../models/MilkProcurement');

    const dispatch = await MPCSDispatch.findByPk(dispatchId);
    if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch record not found' });

    if (dispatch.status !== 'RECEIVED_BY_DISTRICT') {
      return res.status(400).json({ success: false, message: 'Milk must be marked as RECEIVED first' });
    }

    dispatch.status = 'MOVED_TO_CHILLER';
    
    // Update ChillerTank level
    if (chillerTankId) {
      const ChillerTank = require('../models/ChillerTank');
      const tank = await ChillerTank.findByPk(chillerTankId);
      if (tank) {
        tank.currentLevel = (tank.currentLevel || 0) + dispatch.totalQuantity;
        if (tank.currentLevel > tank.capacity) tank.status = 'FULL';
        await tank.save();
      }
    }
    
    await dispatch.save();

    // Cascading update to all individual logs
    await MilkProcurement.update({ dispatchStatus: 'MOVED_TO_CHILLER' }, {
        where: { mpcsDispatchId: dispatch.id }
    });

    res.status(200).json({ success: true, message: 'MPCS Bulk session moved to Chiller Storage' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error moving milk to chiller', error: error.message });
  }
};

// Update work status
exports.updateWorkStatus = async (req, res) => {
  try {
    const { workId } = req.params;
    const { status, stage } = req.body;

    const work = await WorkAssignment.findByPk(workId);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work assignment not found',
      });
    }

    if (status) work.status = status;
    if (stage) work.stage = stage;
    if (status === 'COMPLETED') work.actualEndTime = new Date();

    await work.save();

    res.status(200).json({
      success: true,
      message: 'Work status updated successfully',
      data: work,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating work status',
      error: error.message,
    });
  }
};

// Get work progress summary
exports.getProgressSummary = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const assignments = await WorkAssignment.findAll({
      where: { supervisorId },
    });

    const summary = {
      totalAssignments: assignments.length,
      pending: assignments.filter((a) => a.status === 'PENDING').length,
      inProgress: assignments.filter((a) => a.status === 'IN_PROGRESS').length,
      completed: assignments.filter((a) => a.status === 'COMPLETED').length,
      onHold: assignments.filter((a) => a.status === 'ON_HOLD').length,
      totalMilkProcessed: assignments.reduce((sum, a) => sum + (a.milkQuantity || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress summary',
      error: error.message,
    });
  }
};

// Control/Monitor machine (update work assignment details)
exports.updateMachineControl = async (req, res) => {
  try {
    const { workId } = req.params;
    const { machineStatus, temperature, notes } = req.body;

    const work = await WorkAssignment.findByPk(workId);
    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work assignment not found',
      });
    }

    if (notes) work.notes = notes;
    await work.save();

    res.status(200).json({
      success: true,
      message: 'Machine control updated',
      data: work,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating machine control',
      error: error.message,
    });
  }
};

exports.getChillerTanks = async (req, res) => {
  try {
    const ChillerTank = require('../models/ChillerTank');
    const Supervisor = require('../models/Supervisor');
    const sup = await Supervisor.findOne({ where: { email: req.user.email } });
    if (!sup) return res.status(404).json({ success: false, message: 'Supervisor not found' });

    const tanks = await ChillerTank.findAll({ where: { dmId: sup.dmId } });
    res.status(200).json({ success: true, data: tanks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chiller tanks', error: error.message });
  }
};

exports.getMyOperators = async (req, res) => {
  try {
    const Supervisor = require('../models/Supervisor');
    const Operator = require('../models/Operator');
    const sup = await Supervisor.findOne({ where: { email: req.user.email } });
    const operators = await Operator.findAll({ where: { supervisorId: sup.id } });
    res.status(200).json({ success: true, data: operators });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed fetching operators', error: err.message });
  }
};
