const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Driver = sequelize.define(
  'Driver',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.STRING,
      allowNull: false,

      comment: 'Unique Driver ID: A1-DM1-TM1-DR1, etc.'
    },
    dmId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to parent District Manager'
    },
    tmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to parent Transport Manager'
    },
    tmNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Transport Manager number'
    },
    dmNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adminNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    drivingLicenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    licenseExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    licenseClass: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'LMV, HMV, HPMV, etc.'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emergencyContactName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergencyContactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ifscCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountHolderName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    aadharNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'),
      defaultValue: 'ACTIVE',
    },
    totalTripsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalEarnings: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 5,
      comment: 'Average rating out of 5'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    timestamps: true,
    tableName: 'drivers'
  }
);

module.exports = Driver;
