const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Trip = sequelize.define(
  'Trip',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tripId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Unique Trip ID: TRIP-2026-001, etc.'
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to Motor Vehicle'
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to Driver'
    },
    driverName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tmNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Starting location'
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Ending location'
    },
    sourceLatitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    sourceLongitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    destinationLatitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    destinationLongitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    tripDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    milkQuantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Milk transported in liters'
    },
    estimatedDistance: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Distance in km'
    },
    actualDistance: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Actual distance traveled in km'
    },
    fuelConsumed: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Fuel consumed in liters'
    },
    tripStatus: {
      type: DataTypes.ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'),
      defaultValue: 'SCHEDULED',
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Milk temperature during transport in celsius'
    },
    temperatureDeviation: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Any temperature deviation notes'
    },
    driverRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Rating given after trip completion (1-5)'
    },
    driverNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issues: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Any issues during trip'
    },
    tollCharges: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    driverPayment: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Amount paid to driver for this trip'
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
    tableName: 'trips'
  }
);

module.exports = Trip;
