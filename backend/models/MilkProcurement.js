const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MilkProcurement = sequelize.define(
  'MilkProcurement',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    farmerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    farmerFarmerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantityLiters: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    milkType: {
      type: DataTypes.ENUM('COW', 'BUFFALO'),
      defaultValue: 'COW',
      allowNull: false,
      comment: 'Milk type for procurement',
    },
    session: {
      type: DataTypes.ENUM('MORNING', 'EVENING'),
      allowNull: false,
      defaultValue: 'MORNING',
      comment: 'Collection session',
    },
    isDispatched: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Has this batch been dispatched?',
    },
    dispatchStatus: {
      type: DataTypes.ENUM('PENDING', 'WAITING_FOR_PICKUP', 'DRIVER_ASSIGNED', 'EN_ROUTE_TO_DISTRICT', 'REACHED_DISTRICT', 'RECEIVED_BY_DISTRICT', 'MOVED_TO_CHILLER', 'COMPLETED', 'WAITING_FOR_VEHICLE'),
      defaultValue: 'PENDING',
      comment: 'Dispatch workflow status',
    },
    mpcsDispatchId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reference to the grouped session dispatch (MPCSDispatch)'
    },
    assignedTripId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedDriverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assignedVehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dispatchedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Dispatch timestamp',
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Temp at procurement point (optional)'
    },
    pricePerLiter: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Computed price/liter (optional)'
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Computed amount for this record (optional)'
    },
    procurementDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    snf: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Solids Not Fat percentage'
    },
    fat: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Fat percentage'
    },
    loggedByMpcsOfficerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'milk_procurement',
    timestamps: true,
  }
);

module.exports = MilkProcurement;
