const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FarmerMilkLog = sequelize.define(
  'FarmerMilkLog',
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
    quantityProduced: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    quantitySold: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    pricePerLiter: {
      type: DataTypes.FLOAT,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
    },
    logDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'farmer_milk_logs',
    timestamps: true,
  }
);

module.exports = FarmerMilkLog;
