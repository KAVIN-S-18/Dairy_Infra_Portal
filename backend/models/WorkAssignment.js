const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkAssignment = sequelize.define(
  'WorkAssignment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    taskDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    milkQuantity: {
      type: DataTypes.FLOAT,
    },
    stage: {
      type: DataTypes.ENUM('RECEPTION', 'FILTRATION', 'COOLING', 'PROCESSING', 'PACKAGING', 'COMPLETED'),
      defaultValue: 'RECEPTION',
    },
    startTime: {
      type: DataTypes.DATE,
    },
    expectedEndTime: {
      type: DataTypes.DATE,
    },
    actualEndTime: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'),
      defaultValue: 'PENDING',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      defaultValue: 'MEDIUM',
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'work_assignments',
    timestamps: true,
  }
);

module.exports = WorkAssignment;
