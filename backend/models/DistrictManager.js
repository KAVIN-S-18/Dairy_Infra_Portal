const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DistrictManager = sequelize.define(
  'DistrictManager',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dmId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique DM ID: A1-DM1, A1-DM2, etc.'
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to parent Admin'
    },
    adminNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Admin number from hierarchy (A1, A2, etc.)'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'district_managers',
    timestamps: true,
  }
);

module.exports = DistrictManager;
