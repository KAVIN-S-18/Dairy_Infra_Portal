const WorkAssignment = require('../models/WorkAssignment');
const OperatorLog = require('../models/OperatorLog');

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
