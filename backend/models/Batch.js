const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Batch = sequelize.define(
  'Batch',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalMilkQuantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expectedCompletionDate: {
      type: DataTypes.DATE,
    },
    actualCompletionDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'CREATED',
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'batches',
    timestamps: true,
  }
);

module.exports = Batch;
