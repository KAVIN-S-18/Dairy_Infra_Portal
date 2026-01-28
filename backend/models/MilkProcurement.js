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
    quality: {
      type: DataTypes.ENUM('A', 'B', 'C'),
      defaultValue: 'B',
    },
    temperature: {
      type: DataTypes.FLOAT,
    },
    pricePerLiter: {
      type: DataTypes.FLOAT,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
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
