const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChillerTank = sequelize.define(
  'ChillerTank',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tankId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique ID: TANK-001, etc.'
    },
    dmId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Owner DM ID'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unitType: {
      type: DataTypes.ENUM('SILO', 'INTERMEDIATE', 'PACKET_STORAGE'),
      defaultValue: 'SILO',
      comment: 'SILO (Raw), INTERMEDIATE (Processed), PACKET_STORAGE (Finished)'
    },
    milkType: {
      type: DataTypes.ENUM('COW', 'BUFFALO', 'MIXED', 'PACKETS'),
      allowNull: false,
    },
    capacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Total capacity in liters'
    },
    currentLevel: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Current milk in tank'
    },
    temperature: {
      type: DataTypes.FLOAT,
      defaultValue: 4.0,
      comment: 'Current temperature in Celsius'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'MAINTENANCE', 'CLEANING', 'FULL'),
      defaultValue: 'ACTIVE',
    },
    lastCleaned: {
        type: DataTypes.DATE,
        allowNull: true
    }
  },
  {
    tableName: 'chiller_tanks',
    timestamps: true,
  }
);

module.exports = ChillerTank;
