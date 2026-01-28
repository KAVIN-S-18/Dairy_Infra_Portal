const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MotorVehicle = sequelize.define(
  'MotorVehicle',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vehicleId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Unique Vehicle ID: A1-DM1-TM1-V1, etc.'
    },
    tmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to Transport Manager'
    },
    tmNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dmNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adminNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Vehicle registration/license plate number'
    },
    chasisNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    engineNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vehicleType: {
      type: DataTypes.ENUM('TRUCK', 'TANKER', 'REFRIGERATED', 'OPEN', 'CLOSED'),
      allowNull: false,
    },
    manufactureBrand: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'e.g., Tata, Mahindra, Ashok Leyland'
    },
    manufactureModel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    capacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Capacity in liters for milk vehicles'
    },
    fuelType: {
      type: DataTypes.ENUM('DIESEL', 'PETROL', 'CNG', 'LPG'),
      defaultValue: 'DIESEL',
    },
    mileage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Current mileage in km'
    },
    registrationExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    insuranceCompany: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    insurancePolicyNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    insuranceExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pollutionCertificateExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fitnessCertificateExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalTrips: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalDistance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Total distance covered in km'
    },
    totalMilkTransported: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Total milk transported in liters'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE', 'DECOMMISSIONED'),
      defaultValue: 'ACTIVE',
    },
    currentDriver: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Current driver ID assigned'
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
    tableName: 'motor_vehicles'
  }
);

module.exports = MotorVehicle;
