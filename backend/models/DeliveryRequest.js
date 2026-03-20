const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DeliveryRequest = sequelize.define('DeliveryRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  deliveryId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  batchId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  districtManagerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transportManagerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'RETAIL_SHOP_GENERAL'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'),
    default: 'PENDING',
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = DeliveryRequest;
