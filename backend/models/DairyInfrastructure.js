const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DairyInfrastructure = sequelize.define(
  'DairyInfrastructure',
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
    equipmentName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    equipmentType: {
      type: DataTypes.ENUM('COOLER', 'PUMP', 'PIPE', 'CONTAINER', 'OTHER'),
    },
    purchaseDate: {
      type: DataTypes.DATE,
    },
    lastMaintenanceDate: {
      type: DataTypes.DATE,
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
    },
    condition: {
      type: DataTypes.ENUM('GOOD', 'FAIR', 'POOR'),
      defaultValue: 'GOOD',
    },
    maintenanceNotes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'dairy_infrastructure',
    timestamps: true,
  }
);

module.exports = DairyInfrastructure;
