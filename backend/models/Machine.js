const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Machine = sequelize.define(
  'Machine',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    machineId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('CLARIFIER', 'PASTEURIZER', 'HOMOGENIZER', 'PACKER'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('IDLE', 'RUNNING', 'MAINTENANCE', 'ERROR'),
      defaultValue: 'IDLE',
    },
    capacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    dmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currentBatchId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'machines',
    timestamps: true,
  }
);

module.exports = Machine;
