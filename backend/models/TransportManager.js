const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TransportManager = sequelize.define(
  'TransportManager',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tmId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Unique TM ID: A1-DM1-TM1, A1-DM1-TM2, etc.'
    },
    dmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to parent District Manager'
    },
    dmNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'DM number from hierarchy (A1-DM1, A1-DM2, etc.)'
    },
    adminNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Admin number (A1, A2, etc.)'
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
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Transport management license'
    },
    licenseExpiry: {
      type: DataTypes.DATE,
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
    tableName: 'transport_managers'
  }
);

module.exports = TransportManager;
