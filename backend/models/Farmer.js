const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Farmer = sequelize.define(
  'Farmer',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    farmerId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Farmer ID: MPCS1-F1, MPCS1-F2, etc.'
    },
    mpcsOfficerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to MPCS Officer'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Email (optional, primary key is phoneNumber)'
    },
    phoneNumber: {
      type: DataTypes.STRING,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      comment: 'Used for default password'
    },
    villageId: {
      type: DataTypes.INTEGER,
    },
    farmSize: {
      type: DataTypes.FLOAT,
    },
    numberOfCattle: {
      type: DataTypes.INTEGER,
    },
    landDetails: {
      type: DataTypes.JSON,
      comment: 'Land details including area, location, irrigation type'
    },
    cattleDetails: {
      type: DataTypes.JSON,
      comment: 'Cattle details including breeds, count, health status'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
    },
    createdByMpcsOfficerId: {
      type: DataTypes.INTEGER,
    },
    mpcsNumber: {
      type: DataTypes.STRING,
      comment: 'MPCS officer number for reference'
    },
  },
  {
    tableName: 'farmers',
    timestamps: true,
  }
);

module.exports = Farmer;
