const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OperatorLog = sequelize.define(
  'OperatorLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    workAssignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    taskCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    startTime: {
      type: DataTypes.DATE,
    },
    endTime: {
      type: DataTypes.DATE,
    },
    outputQuantity: {
      type: DataTypes.FLOAT,
    },
    qualityNotes: {
      type: DataTypes.TEXT,
    },
    issuesFaced: {
      type: DataTypes.TEXT,
    },
    logDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'operator_logs',
    timestamps: true,
  }
);

module.exports = OperatorLog;
