const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define(
  'Admin',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique admin ID: A1, A2, A3, etc.'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    organizationName: {
      type: DataTypes.STRING,
    },
    organizationType: {
      type: DataTypes.ENUM('COOPERATIVE', 'PRIVATE'),
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    approvedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'admins',
    timestamps: true,
  }
);

module.exports = Admin;
