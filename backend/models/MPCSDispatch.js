const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MPCSDispatch = sequelize.define(
  'MPCSDispatch',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dispatchId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique ID: DISP-A1-DM1-MPCS1-2026-03-18-COW-MORNING'
    },
    mpcsOfficerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mpcsName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    milkType: {
      type: DataTypes.ENUM('COW', 'BUFFALO'),
      allowNull: false,
    },
    session: {
      type: DataTypes.ENUM('MORNING', 'EVENING'),
      allowNull: false,
    },
    totalQuantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'WAITING_FOR_PICKUP',
        'DRIVER_ASSIGNED',
        'EN_ROUTE_TO_DISTRICT',
        'REACHED_DISTRICT',
        'RECEIVED_BY_DISTRICT',
        'MOVED_TO_CHILLER'
      ),
      defaultValue: 'WAITING_FOR_PICKUP',
    },
    assignedTripId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reference to the tripId assigned by TM'
    },
    dispatchDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: 'mpcs_dispatches',
    timestamps: true,
  }
);

module.exports = MPCSDispatch;
