const WorkAssignment = require('../models/WorkAssignment');
const OperatorLog = require('../models/OperatorLog');

// Get assigned work for operator
exports.getAssignedWork = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const assignments = await WorkAssignment.findAll({
      where: { operatorId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned work',
      error: error.message,
    });
  }
};

// Get today's work
exports.getTodaysWork = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignments = await WorkAssignment.findAll({
      where: {
        operatorId,
        createdAt: {
          [require('sequelize').Op.between]: [today, tomorrow],
        },
      },
      order: [['startTime', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s work',
      error: error.message,
    });
  }
};

// Log work completion
exports.logWorkCompletion = async (req, res) => {
  try {
    const { workAssignmentId } = req.params;
    const { outputQuantity, qualityNotes, issuesFaced } = req.body;
    const operatorId = req.user.id;

    const workAssignment = await WorkAssignment.findByPk(workAssignmentId);
    if (!workAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Work assignment not found',
      });
    }

    // Create operator log
    const log = await OperatorLog.create({
      operatorId,
      workAssignmentId,
      taskCompleted: true,
      startTime: workAssignment.startTime,
      endTime: new Date(),
      outputQuantity,
      qualityNotes,
      issuesFaced,
      logDate: new Date(),
    });

    // Update work assignment status
    workAssignment.status = 'COMPLETED';
    workAssignment.actualEndTime = new Date();
    await workAssignment.save();

    res.status(201).json({
      success: true,
      message: 'Work completion logged successfully',
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging work completion',
      error: error.message,
    });
  }
};

// Get daily logs for operator
exports.getDailyLogs = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { date } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const logs = await OperatorLog.findAll({
      where: {
        operatorId,
        logDate: {
          [require('sequelize').Op.between]: [queryDate, nextDay],
        },
      },
      order: [['logDate', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching daily logs',
      error: error.message,
    });
  }
};

// Get work summary
exports.getWorkSummary = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const assignments = await WorkAssignment.findAll({
      where: { operatorId },
    });

    const summary = {
      totalAssigned: assignments.length,
      completed: assignments.filter((a) => a.status === 'COMPLETED').length,
      inProgress: assignments.filter((a) => a.status === 'IN_PROGRESS').length,
      pending: assignments.filter((a) => a.status === 'PENDING').length,
      totalOutputQuantity: 0,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching work summary',
      error: error.message,
    });
  }
};
